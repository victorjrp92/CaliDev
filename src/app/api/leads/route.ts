import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CAMPAIGNS } from "@/lib/campaigns";
import { enviarConfirmacion } from "@/lib/correo";
import { indicativoPorIso } from "@/lib/indicativos";
import {
  ALL_QUESTIONS,
  esMulti,
  isComplete,
  scoreLead,
  valoresDe,
  type LeadAnswerKey,
  type LeadAnswers,
} from "@/lib/leads";

/**
 * Endpoint público de captura. El puntaje SIEMPRE se calcula aquí y nunca se
 * acepta del cliente: si viniera del navegador, cualquiera podría enviarse como
 * lead con puntaje 100.
 *
 * POST  crea el lead apenas se entrega el contacto (paso 2), con las respuestas
 *       del paso 1. Así un abandono en el paso 3 igual deja un lead contactable.
 * PATCH completa ese mismo lead con las respuestas del paso 3 y recalcula, y
 *       también recoge la aspiración, que llega después de enviar.
 */

const MAX_TEXT = 200;
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(input: unknown, max = MAX_TEXT): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Solo se aceptan valores que existan en el esquema de preguntas.
 *
 * En las preguntas de varias respuestas se valida cada valor por separado y se
 * vuelve a unir en el orden en que están declaradas las opciones. Así una
 * cadena manipulada —valores inventados, repetidos, o cien de golpe— no llega a
 * la base ni al puntaje.
 */
function cleanAnswers(input: unknown): LeadAnswers {
  if (typeof input !== "object" || input === null) return {};
  const raw = input as Record<string, unknown>;
  const answers: LeadAnswers = {};

  for (const question of ALL_QUESTIONS) {
    const value = raw[question.key];
    if (typeof value !== "string") continue;

    const permitidos = question.options.map((o) => o.value);

    if (!esMulti(question.key)) {
      if (permitidos.includes(value)) answers[question.key] = value;
      continue;
    }

    const elegidos = new Set(valoresDe(value).filter((v) => permitidos.includes(v)));
    if (elegidos.size === 0) continue;

    // Una opción exclusiva anula al resto aunque el cliente mande las dos.
    const exclusiva = question.options.find(
      (o) => o.exclusiva && elegidos.has(o.value)
    );
    answers[question.key] = exclusiva
      ? exclusiva.value
      : permitidos.filter((v) => elegidos.has(v)).join(",");
  }
  return answers;
}

/**
 * El país sale del indicativo que la persona eligió, no de una pregunta.
 *
 * Devuelve la zona —que es lo que puntúa y lo que enruta— y el nombre del país,
 * que se guarda aparte para preparar la conversación.
 */
function paisDesdeIso(iso: unknown): { zona: string | null; nombre: string | null } {
  if (typeof iso !== "string") return { zona: null, nombre: null };
  const ind = indicativoPorIso(iso);
  if (!ind) return { zona: null, nombre: null };
  return { zona: ind.zona, nombre: ind.pais };
}

function answerColumns(answers: LeadAnswers) {
  const get = (key: LeadAnswerKey) => answers[key] ?? null;
  return {
    role: get("role"),
    staff: get("staff"),
    country: get("country"),
    herramientas: get("herramientas"),
    repetitivo: get("repetitivo"),
    freno: get("freno"),
    urgency: get("urgency"),
    aspiracion: get("aspiracion"),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = clean(body.name, 120);
    const whatsapp = clean(body.whatsapp, 40);
    if (!name || !whatsapp) {
      return NextResponse.json(
        { error: "Nombre y WhatsApp son obligatorios" },
        { status: 400 }
      );
    }

    const email = clean(body.email, 160);
    const esReferido = Boolean(clean(body.referral_contact, 300));

    // El correo es obligatorio porque es lo que sostiene la promesa de
    // respuesta en 24 horas: por WhatsApp se contesta a quien encaja, pero el
    // "no" también hay que poder darlo, y darlo por escrito. La vía de referido
    // queda fuera: ahí quien escribe no está pidiendo nada para sí.
    if (!esReferido && (!email || !CORREO_OK.test(email))) {
      return NextResponse.json(
        { error: "Hace falta un correo válido" },
        { status: 400 }
      );
    }

    const company = clean(body.company, 160);
    const referralContact = clean(body.referral_contact, 300);
    const pais = paisDesdeIso(body.pais_iso);

    const campaign =
      typeof body.campaign === "string" && body.campaign in CAMPAIGNS
        ? body.campaign
        : "directo";

    const answers: LeadAnswers = {
      ...cleanAnswers(body.answers),
      ...(pais.zona ? cleanAnswers({ country: pais.zona }) : {}),
    };
    const score = scoreLead(answers);
    const cols = answerColumns(answers);

    const result = await sql`
      INSERT INTO leads (
        campaign, name, company, whatsapp, email,
        role, staff, country, country_other,
        herramientas, repetitivo, freno, urgency, aspiracion,
        score_value, score_intent, score_total, track, qualified,
        completed, referral_contact
      ) VALUES (
        ${campaign}, ${name}, ${company}, ${whatsapp}, ${email},
        ${cols.role}, ${cols.staff}, ${cols.country}, ${pais.nombre},
        ${cols.herramientas}, ${cols.repetitivo}, ${cols.freno}, ${cols.urgency}, ${cols.aspiracion},
        ${score.value}, ${score.intent}, ${score.total}, ${score.track}, ${score.qualified},
        ${isComplete(answers)}, ${referralContact}
      )
      RETURNING id
    `;

    // Después de guardar y sin poder tumbar la respuesta: ver lib/correo.ts.
    if (email && !esReferido) {
      void enviarConfirmacion({ nombre: name, correo: email });
    }

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
      track: score.track,
    });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    // Se reconstruye el set completo de respuestas: el puntaje depende de los
    // dos pasos, así que releemos las del paso 1 en vez de confiar en el cliente.
    const existing = await sql`
      SELECT role, staff, country, freno, repetitivo FROM leads WHERE id = ${id}
    `;
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const stored = existing.rows[0];
    const answers: LeadAnswers = {
      ...cleanAnswers({
        role: stored.role,
        staff: stored.staff,
        country: stored.country,
        freno: stored.freno,
        repetitivo: stored.repetitivo,
      }),
      ...cleanAnswers(body.answers),
    };

    const score = scoreLead(answers);
    const cols = answerColumns(answers);
    const company = clean(body.company, 160);

    await sql`
      UPDATE leads SET
        herramientas = ${cols.herramientas},
        urgency = ${cols.urgency},
        aspiracion = ${cols.aspiracion},
        company = COALESCE(${company}, company),
        score_value = ${score.value},
        score_intent = ${score.intent},
        score_total = ${score.total},
        track = ${score.track},
        qualified = ${score.qualified},
        completed = ${isComplete(answers)},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, track: score.track });
  } catch (err) {
    console.error("Lead update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
