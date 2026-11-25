import { sql } from "@/lib/db";
import type { Actor } from "./actor";
import { type CitaAgenda, citasEntre, citasSinHora, diaColombia, semanaColombia } from "./agenda";
import { type Aprobacion, listarAprobaciones } from "./aprobaciones";
import { type Cobro, cobrosQueVencen } from "./cobros";
import { resumen } from "./finanzas";
import { listarOportunidades, type Oportunidad } from "./oportunidades";
import { type Permiso, tienePermiso } from "./permisos";
import { listarTareas, type Tarea } from "./tareas";

/**
 * Pestaña Hoy (spec §3 y §8): las llamadas del día con su brief, lo vencido,
 * lo que espera decisión, el embudo de la semana contra la meta y, desde la
 * entrega 1c, la plata (MRR, ingreso del mes contra la meta y los cobros en
 * mora o que vencen en 7 días). Cada bloque sale solo si quien mira tiene
 * permiso de leerlo; si no, viene `null`.
 */

/** Meta y línea base fijadas con Victor el 22-nov-2026 (spec §8). */
export const META = {
  ingresoMesCop: 20_000_000,
  mes: "2027-05",
  cierresBaseMes: 3,
  // A precio publicado (2,5M + 0,25M/mes) el mes 6 cobra unos 4·N millones: hacen falta ~5 cierres al mes.
  cierresNecesariosMes: 5,
} as const;

const SEMANAS_POR_MES = 52 / 12;

export type Embudo = {
  desde: string;
  hasta: string;
  conversaciones: number;
  calificados: number;
  diagnosticos_agendados: number;
  diagnosticos_hechos: number;
  propuestas: number;
  cierres_mes: number;
  /** ganados / oportunidades que alguna vez llegaron a diagnóstico; null mientras no haya diagnósticos. */
  tasa_cierre: number | null;
  meta: typeof META & { diagnosticos_semana_necesarios: number | null };
};

export type Hoy = {
  dia: string;
  ahora: string;
  citas: CitaAgenda[] | null;
  citas_sin_hora: number | null;
  tareas: Tarea[] | null;
  oportunidades_vencidas: Oportunidad[] | null;
  aprobaciones: { total: number; primeras: Aprobacion[] } | null;
  embudo: Embudo | null;
  finanzas: FinanzasHoy | null;
};

export type FinanzasHoy = {
  mrr_cop: number;
  ingreso_mes_cop: number;
  meta_cop: number;
  avance: number;
  meses_restantes: number;
  mora_cobros: number;
  mora_total_cop: number;
  /** Pendientes vencidos o que vencen en los próximos 7 días, los vencidos primero. */
  cobros_vencen: Cobro[];
};

const contar = async (q: Promise<{ rows: { n: string | number }[] }>) => Number((await q).rows[0]?.n ?? 0);
const existe = async (t: string) => (await sql<{ ok: boolean }>`SELECT to_regclass(${t}) IS NOT NULL AS ok`).rows[0]?.ok ?? false;

/** Etapa alcanzada en [desde, hasta) según el historial, contando oportunidades distintas. */
const llegaronA = (etapa: string, desde: Date, hasta: Date) =>
  contar(sql`SELECT COUNT(DISTINCT oportunidad_id) AS n FROM crm_etapas_historial
             WHERE a = ${etapa} AND at >= ${desde.toISOString()} AND at < ${hasta.toISOString()}`);

export async function embudo(ahora = new Date()): Promise<Embudo> {
  const { desde, hasta } = semanaColombia(ahora);
  const d = desde.toISOString();
  const h = hasta.toISOString();
  const mes = new Date(`${diaColombia(null, ahora).dia.slice(0, 7)}-01T00:00:00-05:00`);

  // Conversaciones: quien escribió por primera vez esta semana, por cualquier canal.
  let conversaciones = 0;
  if (await existe("leads")) conversaciones += await contar(sql`SELECT COUNT(*) AS n FROM leads WHERE created_at >= ${d} AND created_at < ${h} AND name NOT LIKE 'PRUEBA CLAUDE%'`);
  if (await existe("contactos")) conversaciones += await contar(sql`SELECT COUNT(*) AS n FROM contactos WHERE created_at >= ${d} AND created_at < ${h}`);
  if (await existe("social_personas")) conversaciones += await contar(sql`SELECT COUNT(*) AS n FROM social_personas WHERE desde >= ${d} AND desde < ${h}`);

  // Diagnósticos agendados: reservas de 1.ª o 2.ª cita hechas esta semana (las sesiones son de clientes).
  const agendados = (await existe("citas"))
    ? await contar(sql`SELECT COUNT(*) AS n FROM citas WHERE reservada_at >= ${d} AND reservada_at < ${h} AND COALESCE(tipo, 'primera') <> 'sesion'`)
    : 0;

  const [calificados, hechos, propuestas, cierres_mes, ganados, diagnosticados] = await Promise.all([
    llegaronA("calificado", desde, hasta),
    llegaronA("diagnostico_hecho", desde, hasta),
    llegaronA("propuesta", desde, hasta),
    llegaronA("ganado", mes, new Date(ahora.getTime() + 1)),
    contar(sql`SELECT COUNT(DISTINCT oportunidad_id) AS n FROM crm_etapas_historial WHERE a = 'ganado'`),
    contar(sql`SELECT COUNT(DISTINCT oportunidad_id) AS n FROM crm_etapas_historial WHERE a IN ('diagnostico_agendado', 'diagnostico_hecho')`),
  ]);
  const tasa = diagnosticados > 0 ? ganados / diagnosticados : null;
  const necesarios = tasa ? Math.ceil((META.cierresNecesariosMes / tasa / SEMANAS_POR_MES) * 10) / 10 : null;

  return {
    desde: d, hasta: h, conversaciones, calificados, diagnosticos_agendados: agendados, diagnosticos_hechos: hechos,
    propuestas, cierres_mes, tasa_cierre: tasa, meta: { ...META, diagnosticos_semana_necesarios: necesarios },
  };
}

export async function hoy(actor: Actor, opciones: { dia?: string | null; ahora?: Date } = {}): Promise<Hoy> {
  const ahora = opciones.ahora ?? new Date();
  const { dia, desde, hasta } = diaColombia(opciones.dia, ahora);
  const puede = (p: Permiso) => tienePermiso(actor.usuario, actor.alcances, p);

  const citas = puede("agenda:leer") ? await citasEntre(desde, hasta) : null;
  const sinHora = puede("agenda:leer") ? (await citasSinHora(200)).length : null;
  const tareas = puede("tareas:leer") ? await listarTareas({ estado: "abierta", venceAntes: hasta.toISOString(), limite: 100 }) : null;
  const vencidas = puede("ventas:leer") ? await listarOportunidades({ abiertas: true, vencenAntes: ahora.toISOString(), limite: 100 }) : null;
  let aprobaciones: Hoy["aprobaciones"] = null;
  if (puede("aprobaciones:leer")) {
    const total = await contar(sql`SELECT COUNT(*) AS n FROM crm_aprobaciones WHERE estado = 'pendiente'`);
    aprobaciones = { total, primeras: await listarAprobaciones("pendiente", 20) };
  }
  const e = puede("ventas:leer") ? await embudo(ahora) : null;
  let finanzas: FinanzasHoy | null = null;
  if (puede("finanzas:leer")) {
    const r = await resumen(actor, {}, ahora);
    finanzas = {
      mrr_cop: r.mrr_cop, ingreso_mes_cop: r.ingreso_mes_cop, meta_cop: r.meta.ingreso_mes_cop, avance: r.meta.avance,
      meses_restantes: r.meta.meses_restantes, mora_cobros: r.mora.cobros, mora_total_cop: r.mora.total_cop,
      cobros_vencen: await cobrosQueVencen(7, ahora),
    };
  }

  return { dia, ahora: ahora.toISOString(), citas, citas_sin_hora: sinHora, tareas, oportunidades_vencidas: vencidas, aprobaciones, embudo: e, finanzas };
}
