import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";

/**
 * Tareas: lo que alguien (humano o agente) tiene que hacer, con área y
 * vencimiento. «Pedir X antes de la llamada» del agente de preparación es una
 * de estas (spec §9).
 */
export const AREAS = ["ventas", "agenda", "contactos", "contratos", "finanzas", "clientes", "contenido", "general"] as const;

export type Tarea = {
  id: number;
  titulo: string;
  area: string;
  entidad: string | null;
  entidad_id: string | null;
  asignada_a: number | null;
  asignada: string | null;
  vence_at: string | null;
  estado: "abierta" | "hecha" | "cancelada";
  creada_por: number | null;
  cerrada_at: string | null;
  created_at: string;
};

export async function tareaPorId(id: number): Promise<Tarea | null> {
  const r = await sql<Tarea>`SELECT t.*, u.nombre AS asignada FROM crm_tareas t LEFT JOIN crm_usuarios u ON u.id = t.asignada_a WHERE t.id = ${id}`;
  return r.rows[0] ?? null;
}

export async function listarTareas(f: { asignadaA?: number | null; area?: string | null; estado?: string | null; venceAntes?: string | null; limite?: number } = {}): Promise<Tarea[]> {
  const lim = Math.min(Math.max(f.limite ?? 200, 1), 500);
  const r = await sql<Tarea>`
    SELECT t.*, u.nombre AS asignada FROM crm_tareas t LEFT JOIN crm_usuarios u ON u.id = t.asignada_a
    WHERE t.estado = ${f.estado ?? "abierta"}
      AND (${f.asignadaA ?? null}::int IS NULL OR t.asignada_a = ${f.asignadaA ?? null})
      AND (${f.area ?? null}::text IS NULL OR t.area = ${f.area ?? null})
      AND (${f.venceAntes ?? null}::timestamptz IS NULL OR t.vence_at < ${f.venceAntes ?? null})
    ORDER BY t.vence_at ASC NULLS LAST, t.id LIMIT ${lim}`;
  return r.rows;
}

export async function crearTarea(actor: Actor | null, d: { titulo: string; area?: string; entidad?: string | null; entidadId?: string | number | null; asignadaA?: number | null; venceAt?: string | null }): Promise<Tarea> {
  const titulo = typeof d.titulo === "string" ? d.titulo.trim() : "";
  if (!titulo) throw new ErrorCrm(400, "campo_requerido", "La tarea necesita un título.", "titulo");
  const area = d.area ?? "general";
  if (!(AREAS as readonly string[]).includes(area)) throw new ErrorCrm(400, "campo_invalido", `Área: ${AREAS.join(", ")}.`, "area");
  const vence = d.venceAt ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(d.venceAt) ? `${d.venceAt}T18:00:00-05:00` : d.venceAt) : null;
  if (vence !== null && Number.isNaN(vence)) throw new ErrorCrm(400, "campo_invalido", "Fecha de vencimiento: AAAA-MM-DD o ISO.", "vence_at");
  const r = await sql<{ id: number }>`
    INSERT INTO crm_tareas (titulo, area, entidad, entidad_id, asignada_a, vence_at, creada_por)
    VALUES (${titulo}, ${area}, ${d.entidad ?? null}, ${d.entidadId == null ? null : String(d.entidadId)}, ${d.asignadaA ?? null},
            ${vence === null ? null : new Date(vence).toISOString()}, ${actor?.usuario.id ?? null}) RETURNING id`;
  const t = (await tareaPorId(r.rows[0].id))!;
  await auditar(actor, "crear", "tarea", t.id, null, t);
  return t;
}

/** Tomar = asignármela. Cerrar = hecha o cancelada. */
export async function tomarTarea(actor: Actor, id: number): Promise<Tarea> {
  const antes = await tareaPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay tarea ${id}.`);
  if (antes.estado !== "abierta") throw new ErrorCrm(400, "regla_tarea", `La tarea ya está ${antes.estado}.`);
  await sql`UPDATE crm_tareas SET asignada_a = ${actor.usuario.id} WHERE id = ${id}`;
  const despues = (await tareaPorId(id))!;
  await auditar(actor, "tomar", "tarea", id, antes, despues);
  return despues;
}

export async function cerrarTarea(actor: Actor, id: number, estado: "hecha" | "cancelada" = "hecha"): Promise<Tarea> {
  if (estado !== "hecha" && estado !== "cancelada") throw new ErrorCrm(400, "campo_invalido", "Estado: hecha o cancelada.", "estado");
  const antes = await tareaPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay tarea ${id}.`);
  const r = await sql`UPDATE crm_tareas SET estado = ${estado}, cerrada_at = NOW() WHERE id = ${id} AND estado = 'abierta' RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(400, "regla_tarea", `La tarea ya está ${antes.estado}.`);
  const despues = (await tareaPorId(id))!;
  await auditar(actor, "cerrar", "tarea", id, antes, despues);
  return despues;
}
