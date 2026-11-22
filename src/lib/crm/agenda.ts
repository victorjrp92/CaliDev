import { sql } from "@/lib/db";
import { duracionDe, horarioDeCita, tipoDe, type TipoCita, ZONA_COLOMBIA } from "@/lib/citas/horarios";
import { ETAPAS_ABIERTAS } from "./etapas";

/**
 * Agenda del CRM: las citas de la tabla vieja `citas` (las crea /agendar y el
 * panel viejo, que siguen igual) vistas con su persona y su oportunidad del
 * CRM, y con la marca de si ya tienen brief (spec §9: el agente de
 * preparación lo escribe 24 h antes).
 */
export type CitaAgenda = {
  id: number;
  tipo: TipoCita;
  nombre: string;
  correo: string;
  inicio: string;
  fin: string;
  persona_id: number | null;
  oportunidad_id: number | null;
  etapa: string | null;
  tiene_brief: boolean;
};

type Fila = {
  id: number; tipo: string | null; nombre: string; correo: string; inicio: Date | string;
  persona_id: number | null; oportunidad_id: number | null; etapa: string | null; tiene_brief: boolean;
};

const existeCitas = async () => (await sql<{ ok: boolean }>`SELECT to_regclass('citas') IS NOT NULL AS ok`).rows[0]?.ok ?? false;

function aAgenda(f: Fila): CitaAgenda {
  const inicio = new Date(f.inicio);
  const h = horarioDeCita({ inicio: inicio.toISOString(), tipo: f.tipo });
  const fin = h?.fin ?? new Date(inicio.getTime() + duracionDe(f) * 60e3);
  return {
    id: f.id, tipo: tipoDe(f), nombre: f.nombre, correo: f.correo, inicio: inicio.toISOString(), fin: fin.toISOString(),
    persona_id: f.persona_id, oportunidad_id: f.oportunidad_id, etapa: f.etapa, tiene_brief: f.tiene_brief,
  };
}

/** Citas reservadas con inicio en [desde, hasta), en orden. La oportunidad es la abierta más reciente de su persona. */
export async function citasEntre(desde: Date, hasta: Date): Promise<CitaAgenda[]> {
  if (!(await existeCitas())) return [];
  const r = await sql<Fila>`
    SELECT c.id, c.tipo, c.nombre, c.correo, c.inicio, x.persona_id, o.id AS oportunidad_id, o.etapa,
      EXISTS (SELECT 1 FROM crm_notas n WHERE n.entidad = 'cita' AND n.entidad_id = c.id::text AND n.tipo = 'brief') AS tiene_brief
    FROM citas c
    LEFT JOIN crm_personas_ref x ON x.tabla = 'citas' AND x.ref_id = c.id::text
    LEFT JOIN LATERAL (
      SELECT id, etapa FROM crm_oportunidades WHERE persona_id = x.persona_id
      ORDER BY (etapa = ANY(${ETAPAS_ABIERTAS})) DESC, updated_at DESC LIMIT 1) o ON TRUE
    WHERE c.inicio >= ${desde.toISOString()} AND c.inicio < ${hasta.toISOString()}
    ORDER BY c.inicio`;
  return r.rows.map(aAgenda);
}

/** Invitaciones mandadas que la persona aún no ha reservado (sin hora). */
export async function citasSinHora(limite = 50): Promise<{ id: number; tipo: TipoCita; nombre: string; correo: string; creada: string }[]> {
  if (!(await existeCitas())) return [];
  const r = await sql<{ id: number; tipo: string | null; nombre: string; correo: string; created_at: Date | string }>`
    SELECT id, tipo, nombre, correo, created_at FROM citas WHERE inicio IS NULL ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limite, 1), 200)}`;
  return r.rows.map((c) => ({ id: c.id, tipo: tipoDe(c), nombre: c.nombre, correo: c.correo, creada: new Date(c.created_at).toISOString() }));
}

/**
 * Límites de un día en hora de Colombia (las citas se agendan en esa hora,
 * 6–20). `dia` es AAAA-MM-DD; sin él, el día de hoy en Colombia.
 */
export function diaColombia(dia?: string | null, ahora = new Date()): { dia: string; desde: Date; hasta: Date } {
  const d = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia)
    ? dia
    : new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_COLOMBIA, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  const desde = new Date(`${d}T00:00:00-05:00`); // Colombia no tiene horario de verano
  if (Number.isNaN(desde.getTime())) throw new RangeError(`Día inválido: ${dia}`);
  return { dia: d, desde, hasta: new Date(desde.getTime() + 864e5) };
}

/** Lunes 00:00 de Colombia de la semana que contiene `ahora`, y el lunes siguiente. */
export function semanaColombia(ahora = new Date()): { desde: Date; hasta: Date } {
  const { desde: hoy } = diaColombia(null, ahora);
  const diaSemana = (new Date(hoy.getTime() + 5 * 3600e3).getUTCDay() + 6) % 7; // 0 = lunes
  const desde = new Date(hoy.getTime() - diaSemana * 864e5);
  return { desde, hasta: new Date(desde.getTime() + 7 * 864e5) };
}
