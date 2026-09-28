import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { sql } from "@/lib/db";
import { CAMPAIGNS } from "@/lib/campaigns";
import { indicativoPorIso } from "@/lib/indicativos";
import {
  BUSCA,
  DOLOR,
  HERRAMIENTAS,
  PLAZO,
  ROL,
  TAMANO,
  limpiarRespuesta,
  type RespuestasDelegar,
} from "@/lib/delegar/preguntas";
import { prioridadDe } from "@/lib/delegar/prioridad";
import { errorDeNumero, numeroNacional } from "@/lib/delegar/telefono";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";
import type { LeadDelegar } from "@/lib/delegar/correos/lead";
import {
  avisoLeadCompleto,
  avisoNuevoContacto,
  avisoNumeroCorregido,
} from "@/lib/delegar/correos/aviso-victor";
import { confirmacionLead } from "@/lib/delegar/correos/confirmacion";

/**
 * Captura del formulario «Quiero empezar a delegar».
 *
 * POST   paso 2: crea el lead con el contacto y las respuestas del paso 1.
 *        Queda como calificación incompleta. Devuelve `id` y `token`.
 * PATCH  con `id` + `token`:
 *          · `accion: "completar"` — paso 3, completa ESE MISMO lead.
 *          · `accion: "contacto"`  — corrige nombre, número o correo, al volver
 *            al paso 2 o desde la confirmación. Nunca crea un segundo lead.
 *
 * La prioridad se calcula aquí y nunca se acepta del navegador.
 *
 * Correos (lib/delegar/correos), siempre con `after()`: salen cuando el lead ya
 * está guardado y la respuesta ya llegó al navegador, y si fallan no afectan a
 * nada.
 *  · Paso 2 → aviso a Víctor «Nuevo contacto (sin terminar)».
 *  · Paso 3 → aviso a Víctor con la prioridad en el asunto, y confirmación al
 *    lead si dejó correo. Una sola vez: un reintento sobre un lead ya
 *    completo no reenvía nada.
 *  · Número corregido → aviso a Víctor con el número viejo y el nuevo.
 * El seguimiento de verdad es por WhatsApp y lo hace una persona.
 */

const VARIANTE = "delegar-v1";
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function texto(input: unknown, max: number): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

/**
 * Columnas propias de este formulario. Se aseguran una vez por instancia del
 * servidor con `ADD COLUMN IF NOT EXISTS`: son opcionales, no tocan las que ya
 * existen y repetirlas no hace nada. Mismas definiciones que lib/db.ts.
 */
let columnas: Promise<unknown> | null = null;
function asegurarColumnas() {
  columnas ??= sql`
    ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS variante TEXT,
      ADD COLUMN IF NOT EXISTS token TEXT,
      ADD COLUMN IF NOT EXISTS actividad TEXT,
      ADD COLUMN IF NOT EXISTS dolor TEXT,
      ADD COLUMN IF NOT EXISTS dolor_otro TEXT,
      ADD COLUMN IF NOT EXISTS herramientas_otro TEXT,
      ADD COLUMN IF NOT EXISTS busca TEXT,
      ADD COLUMN IF NOT EXISTS plazo TEXT,
      ADD COLUMN IF NOT EXISTS prioridad TEXT,
      ADD COLUMN IF NOT EXISTS prioridad_motivo TEXT,
      ADD COLUMN IF NOT EXISTS utm TEXT,
      ADD COLUMN IF NOT EXISTS social_codigo TEXT
  `.catch((err) => {
    columnas = null; // que el siguiente intento lo repita
    throw err;
  });
  return columnas;
}

type Contacto = {
  nombre: string;
  whatsapp: string;
  zona: string;
  pais: string;
  correo: string | null;
};

/** Valida el contacto. Devuelve el error para el visitante o los datos limpios. */
function contactoDe(body: Record<string, unknown>): { error: string } | Contacto {
  const nombre = texto(body.nombre, 120);
  if (!nombre || nombre.length < 2) return { error: "Falta tu nombre." };

  const iso = typeof body.pais_iso === "string" ? body.pais_iso : "";
  const ind = indicativoPorIso(iso);
  const numero = typeof body.numero === "string" ? body.numero : "";
  if (!ind || errorDeNumero(iso, numero)) return { error: "El número de WhatsApp no es válido." };

  const correo = texto(body.correo, 160);
  if (correo && !CORREO_OK.test(correo)) return { error: "El correo no es válido." };

  return {
    nombre,
    whatsapp: `${ind.codigo} ${numeroNacional(iso, numero)}`,
    zona: ind.zona,
    pais: ind.pais,
    correo,
  };
}

function paso1De(raw: unknown) {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    rol: limpiarRespuesta(ROL, r.rol),
    dolor: limpiarRespuesta(DOLOR, r.dolor),
    tamano: limpiarRespuesta(TAMANO, r.tamano),
    actividad: texto(r.actividad, 160),
    dolorOtro: texto(r.dolor_otro, 300),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const contacto = contactoDe(body);
    if ("error" in contacto) return NextResponse.json({ error: contacto.error }, { status: 400 });

    const p1 = paso1De(body.respuestas);
    if (!p1.rol || p1.rol === "ninguna" || !p1.dolor || !p1.tamano || !p1.actividad) {
      return NextResponse.json({ error: "Faltan respuestas del paso 1." }, { status: 400 });
    }

    const campaign =
      typeof body.campaign === "string" && body.campaign in CAMPAIGNS ? body.campaign : "directo";
    const utm = texto(body.utm, 300);
    // Código de la persona si llegó desde el botón de Instagram (calidev.dev/social).
    const socialCodigo = typeof body.social_codigo === "string" && /^[a-z0-9]{10}$/.test(body.social_codigo) ? body.social_codigo : null;
    const token = randomUUID();
    const { prioridad, motivo } = prioridadDe({}, false);

    await asegurarColumnas();
    const resultado = await sql`
      INSERT INTO leads (
        campaign, variante, token, name, whatsapp, email, country, country_other,
        role, staff, actividad, dolor, dolor_otro,
        track, qualified, completed, prioridad, prioridad_motivo, utm, social_codigo
      ) VALUES (
        ${campaign}, ${VARIANTE}, ${token}, ${contacto.nombre}, ${contacto.whatsapp}, ${contacto.correo},
        ${contacto.zona}, ${contacto.pais},
        ${p1.rol}, ${p1.tamano}, ${p1.actividad}, ${p1.dolor}, ${p1.dolor === "otro" ? p1.dolorOtro : null},
        'revisar', TRUE, FALSE, ${prioridad}, ${motivo}, ${utm}, ${socialCodigo}
      )
      RETURNING *
    `;

    const lead = resultado.rows[0] as LeadDelegar;
    after(() => enviarCorreo(avisoNuevoContacto(lead)));

    return NextResponse.json({ ok: true, id: lead.id, token });
  } catch (err) {
    console.error("delegar POST:", err);
    return NextResponse.json({ error: "No pudimos guardar tus datos." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    const token = typeof body.token === "string" ? body.token : "";
    if (!Number.isInteger(id) || id <= 0 || !token) {
      return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
    }

    await asegurarColumnas();
    const existe = await sql`
      SELECT whatsapp, completed FROM leads
      WHERE id = ${id} AND token = ${token} AND variante = ${VARIANTE}
    `;
    if (existe.rows.length === 0) {
      return NextResponse.json({ error: "No encontramos tu solicitud." }, { status: 404 });
    }
    const antes = existe.rows[0] as { whatsapp: string; completed: boolean };

    if (body.accion === "contacto") {
      const contacto = contactoDe(body);
      if ("error" in contacto) return NextResponse.json({ error: contacto.error }, { status: 400 });
      // Al volver al paso 2 también pueden haber cambiado las respuestas del 1.
      const p1 = paso1De(body.respuestas);
      const actualizado = await sql`
        UPDATE leads SET
          name = ${contacto.nombre},
          whatsapp = ${contacto.whatsapp},
          email = ${contacto.correo},
          country = ${contacto.zona},
          country_other = ${contacto.pais},
          role = COALESCE(${p1.rol === "ninguna" ? null : p1.rol}, role),
          staff = COALESCE(${p1.tamano}, staff),
          actividad = COALESCE(${p1.actividad}, actividad),
          dolor = COALESCE(${p1.dolor}, dolor),
          dolor_otro = CASE WHEN COALESCE(${p1.dolor}, dolor) = 'otro'
                            THEN COALESCE(${p1.dolorOtro}, dolor_otro) ELSE NULL END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      const lead = actualizado.rows[0] as LeadDelegar;
      if (lead.whatsapp !== antes.whatsapp) {
        after(() => enviarCorreo(avisoNumeroCorregido(lead, antes.whatsapp)));
      }
      return NextResponse.json({ ok: true });
    }

    if (body.accion === "completar") {
      const r = (typeof body.respuestas === "object" && body.respuestas !== null
        ? body.respuestas
        : {}) as Record<string, unknown>;
      const respuestas: RespuestasDelegar = {
        herramientas: limpiarRespuesta(HERRAMIENTAS, r.herramientas) ?? undefined,
        busca: limpiarRespuesta(BUSCA, r.busca) ?? undefined,
        plazo: limpiarRespuesta(PLAZO, r.plazo) ?? undefined,
      };
      if (!respuestas.herramientas || !respuestas.busca || !respuestas.plazo) {
        return NextResponse.json({ error: "Faltan respuestas del paso 3." }, { status: 400 });
      }
      const herramientasOtro = respuestas.herramientas.split(",").includes("otro")
        ? texto(r.herramientas_otro, 300)
        : null;
      const { prioridad, motivo } = prioridadDe(respuestas, true);

      const completado = await sql`
        UPDATE leads SET
          herramientas = ${respuestas.herramientas},
          herramientas_otro = ${herramientasOtro},
          busca = ${respuestas.busca},
          plazo = ${respuestas.plazo},
          company = COALESCE(${texto(body.empresa, 160)}, company),
          completed = TRUE,
          prioridad = ${prioridad},
          prioridad_motivo = ${motivo},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!antes.completed) {
        const lead = completado.rows[0] as LeadDelegar;
        after(async () => {
          await enviarCorreo(avisoLeadCompleto(lead));
          const confirmacion = confirmacionLead(lead);
          if (confirmacion) await enviarCorreo(confirmacion);
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    console.error("delegar PATCH:", err);
    return NextResponse.json({ error: "No pudimos guardar tus respuestas." }, { status: 500 });
  }
}
