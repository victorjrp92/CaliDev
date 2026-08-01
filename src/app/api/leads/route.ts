import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CAMPAIGNS } from "@/lib/campaigns";
import {
  ALL_QUESTIONS,
  isComplete,
  scoreLead,
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
 * PATCH completa ese mismo lead con las respuestas del paso 3 y recalcula.
 */

const MAX_TEXT = 200;

function clean(input: unknown, max = MAX_TEXT): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/** Solo se aceptan valores que existan en el esquema de preguntas. */
function cleanAnswers(input: unknown): LeadAnswers {
  if (typeof input !== "object" || input === null) return {};
  const raw = input as Record<string, unknown>;
  const answers: LeadAnswers = {};

  for (const question of ALL_QUESTIONS) {
    const value = raw[question.key];
    if (typeof value !== "string") continue;
    if (question.options.some((option) => option.value === value)) {
      answers[question.key] = value;
    }
  }
  return answers;
}

function answerColumns(answers: LeadAnswers) {
  const get = (key: LeadAnswerKey) => answers[key] ?? null;
  return {
    role: get("role"),
    staff: get("staff"),
    country: get("country"),
    payment_model: get("payment_model"),
    payroll_hours: get("payroll_hours"),
    services_month: get("services_month"),
    urgency: get("urgency"),
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

    const company = clean(body.company, 160);
    const email = clean(body.email, 160);
    const countryOther = clean(body.country_other, 80);
    const referralContact = clean(body.referral_contact, 300);

    const campaign =
      typeof body.campaign === "string" && body.campaign in CAMPAIGNS
        ? body.campaign
        : "directo";

    const answers = cleanAnswers(body.answers);
    const score = scoreLead(answers);
    const cols = answerColumns(answers);

    const result = await sql`
      INSERT INTO leads (
        campaign, name, company, whatsapp, email,
        role, staff, country, country_other,
        payment_model, payroll_hours, services_month, urgency,
        score_value, score_intent, score_total, track, qualified,
        completed, referral_contact
      ) VALUES (
        ${campaign}, ${name}, ${company}, ${whatsapp}, ${email},
        ${cols.role}, ${cols.staff}, ${cols.country}, ${countryOther},
        ${cols.payment_model}, ${cols.payroll_hours}, ${cols.services_month}, ${cols.urgency},
        ${score.value}, ${score.intent}, ${score.total}, ${score.track}, ${score.qualified},
        ${isComplete(answers)}, ${referralContact}
      )
      RETURNING id
    `;

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
      SELECT role, staff, country FROM leads WHERE id = ${id}
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
      }),
      ...cleanAnswers(body.answers),
    };

    const score = scoreLead(answers);
    const cols = answerColumns(answers);

    await sql`
      UPDATE leads SET
        payment_model = ${cols.payment_model},
        payroll_hours = ${cols.payroll_hours},
        services_month = ${cols.services_month},
        urgency = ${cols.urgency},
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
