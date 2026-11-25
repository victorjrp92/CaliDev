import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "../actor";
import { type Aprobacion, registrarEjecutor, solicitar } from "../aprobaciones";
import { ETAPAS, esEtapa, type Etapa, NOMBRE_ETAPA, problemaDeCambio } from "../etapas";
import { exigir } from "../guardia";
import { agregarNota, type Nota } from "../notas";
import { moverEtapa, type Oportunidad, oportunidadPorId } from "../oportunidades";
import { actorDeAgente } from "./identidad";
import { preguntarModelo, textoDe } from "./modelo";

/**
 * Agente de resumen (spec §9): Victor pega o dicta las notas de la llamada; el
 * agente las deja como nota `resumen_llamada` en la oportunidad y propone etapa
 * y próximo paso. La propuesta no mueve nada: entra a Aprobaciones como
 * `mover_etapa` y solo se aplica cuando una persona la aprueba (y la puede
 * corregir antes). Ganar sigue exigiendo oportunidad:ganar a quien aprueba.
 */
const MAX_NOTAS = 12_000;

export type Propuesta = { etapa: Etapa; proximo_paso: string | null; proximo_paso_at: string | null; motivo_perdida: string | null };
export type ResultadoResumen = { nota: Nota; propuesta: Propuesta | null; aprobacion: Aprobacion | null; problema: string | null };

/** La oportunidad abierta más reciente de la persona de una cita. */
async function oportunidadDeCita(citaId: number): Promise<number | null> {
  const r = await sql<{ id: number }>`
    SELECT o.id FROM crm_personas_ref x JOIN crm_oportunidades o ON o.persona_id = x.persona_id
    WHERE x.tabla = 'citas' AND x.ref_id = ${String(citaId)}
    ORDER BY (o.etapa NOT IN ('ganado', 'perdido')) DESC, o.updated_at DESC LIMIT 1`;
  return r.rows[0]?.id ?? null;
}

function prompt(o: Oportunidad | null, notas: string, hoy: string): string {
  const etapas = ETAPAS.map((e) => `${e} (${NOMBRE_ETAPA[e]})`).join(", ");
  return [
    "Eres el agente de resumen del CRM de Calidev, una consultora de tecnología para empresas.",
    "Abajo van las notas crudas de una llamada con un prospecto. Resume y propone el siguiente movimiento.",
    "No inventes nada que no esté en las notas. Español, frases cortas.",
    `Hoy es ${hoy}. Etapas posibles: ${etapas}.`,
    o ? `La oportunidad «${o.titulo}» está hoy en ${o.etapa}.` : "No hay oportunidad abierta: solo resume.",
    "Devuelve JSON:",
    '{"resumen": "5-10 líneas: qué tienen hoy, qué duele, qué quieren, objeciones, acuerdos",',
    ' "etapa": "una de las etapas o null si no cambia", "proximo_paso": "acción concreta o null",',
    ' "proximo_paso_at": "AAAA-MM-DD o null", "motivo_perdida": "solo si la etapa es perdido"}',
    "",
    "NOTAS:",
    notas,
  ].join("\n");
}

export async function resumirLlamada(actor: Actor, d: { oportunidadId?: number | null; citaId?: number | null; notas: string }): Promise<ResultadoResumen> {
  exigir(actor, "notas:escribir");
  const notas = typeof d.notas === "string" ? d.notas.trim().slice(0, MAX_NOTAS) : "";
  if (notas.length < 20) throw new ErrorCrm(400, "campo_requerido", "Pega las notas de la llamada (al menos un par de frases).", "notas");
  const opId = d.oportunidadId ?? (d.citaId ? await oportunidadDeCita(d.citaId) : null);
  const o = opId ? await oportunidadPorId(opId) : null;
  if (opId && !o) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${opId}.`);
  if (!o && !d.citaId) throw new ErrorCrm(400, "campo_requerido", "Di de qué oportunidad o cita son las notas.", "oportunidad_id");

  const m = await preguntarModelo(prompt(o, notas, new Date().toISOString().slice(0, 10)));
  const resumen = textoDe(m.resumen, 4000);
  if (!resumen) throw new ErrorCrm(502, "modelo_fallo", "El modelo no devolvió un resumen; vuelve a intentarlo.");

  const agente = await actorDeAgente("resumen");
  const cuerpo = `${resumen}\n\n— Notas de ${actor.usuario.nombre} —\n${notas}`;
  const nota = await agregarNota(agente, o ? { entidad: "oportunidad", entidadId: o.id, tipo: "resumen_llamada", cuerpo } : { entidad: "cita", entidadId: d.citaId!, tipo: "resumen_llamada", cuerpo });
  if (!o) return { nota, propuesta: null, aprobacion: null, problema: null };

  const etapa = textoDe(m.etapa, 30);
  const propuesta: Propuesta = {
    etapa: esEtapa(etapa) ? etapa : (o.etapa as Etapa),
    proximo_paso: textoDe(m.proximo_paso, 300),
    proximo_paso_at: /^\d{4}-\d{2}-\d{2}$/.test(textoDe(m.proximo_paso_at, 10) ?? "") ? textoDe(m.proximo_paso_at, 10) : null,
    motivo_perdida: textoDe(m.motivo_perdida, 300),
  };
  // Propuesta incompleta (sin fecha, perdida sin motivo…): queda el resumen y se dice qué faltó.
  const p = problemaDeCambio({ a: propuesta.etapa, proximoPaso: propuesta.proximo_paso, proximoPasoAt: propuesta.proximo_paso_at, motivoPerdida: propuesta.motivo_perdida });
  if (p) return { nota, propuesta, aprobacion: null, problema: p.mensaje };

  const nombre = (e: string) => (esEtapa(e) ? NOMBRE_ETAPA[e] : e);
  const cambio = propuesta.etapa !== o.etapa ? `${nombre(o.etapa)} → ${nombre(propuesta.etapa)}` : `Sigue en ${nombre(o.etapa)}`;
  const vista = [
    `${o.titulo}: ${cambio}.`,
    propuesta.proximo_paso ? `Próximo paso: ${propuesta.proximo_paso} (${propuesta.proximo_paso_at}).` : null,
    propuesta.motivo_perdida ? `Motivo: ${propuesta.motivo_perdida}.` : null,
  ].filter(Boolean).join("\n");
  const aprobacion = await solicitar(agente, {
    tipo: "mover_etapa",
    payload: { oportunidad_id: o.id, de: o.etapa, a: propuesta.etapa, proximo_paso: propuesta.proximo_paso, proximo_paso_at: propuesta.proximo_paso_at, motivo_perdida: propuesta.motivo_perdida },
    vistaPrevia: vista,
    entidad: "oportunidad",
    entidadId: o.id,
  });
  return { nota, propuesta, aprobacion, problema: null };
}

/** Al aprobar: si la oportunidad se movió desde la propuesta, no se pisa. */
registrarEjecutor("mover_etapa", async (payload, aprobador) => {
  const id = Number(payload.oportunidad_id);
  const o = Number.isInteger(id) ? await oportunidadPorId(id) : null;
  if (!o) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${payload.oportunidad_id}.`);
  if (typeof payload.de === "string" && payload.de !== o.etapa) {
    throw new ErrorCrm(409, "cambio_concurrente", `La oportunidad pasó a ${o.etapa} después de la propuesta; revísala a mano.`);
  }
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const movida = await moverEtapa(aprobador, id, { a: String(payload.a ?? ""), proximoPaso: s(payload.proximo_paso), proximoPasoAt: s(payload.proximo_paso_at), motivoPerdida: s(payload.motivo_perdida) });
  return { oportunidad_id: movida.id, etapa: movida.etapa, proximo_paso: movida.proximo_paso };
});
