import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";

/**
 * Notas sobre cualquier entidad. `brief` lo escribe el agente de preparación
 * antes de un diagnóstico; `resumen_llamada`, el de resumen después (spec §9).
 */
export const ENTIDADES_NOTA = ["persona", "empresa", "oportunidad", "cita", "tarea"] as const;
export const TIPOS_NOTA = ["nota", "brief", "resumen_llamada"] as const;
export type TipoNota = (typeof TIPOS_NOTA)[number];

export type Nota = { id: number; entidad: string; entidad_id: string; autor_id: number | null; autor: string | null; tipo: TipoNota; cuerpo: string; created_at: string };

export async function agregarNota(actor: Actor | null, d: { entidad: string; entidadId: string | number; tipo?: string; cuerpo: string }): Promise<Nota> {
  if (!(ENTIDADES_NOTA as readonly string[]).includes(d.entidad)) {
    throw new ErrorCrm(400, "campo_invalido", `Entidad: ${ENTIDADES_NOTA.join(", ")}.`, "entidad");
  }
  const tipo = d.tipo ?? "nota";
  if (!(TIPOS_NOTA as readonly string[]).includes(tipo)) throw new ErrorCrm(400, "campo_invalido", `Tipo: ${TIPOS_NOTA.join(", ")}.`, "tipo");
  const cuerpo = typeof d.cuerpo === "string" ? d.cuerpo.trim() : "";
  if (!cuerpo) throw new ErrorCrm(400, "campo_requerido", "La nota está vacía.", "cuerpo");
  if (cuerpo.length > 20000) throw new ErrorCrm(400, "campo_invalido", "La nota admite hasta 20.000 caracteres.", "cuerpo");
  const id = String(d.entidadId);
  if (!/^\d+$/.test(id)) throw new ErrorCrm(400, "campo_invalido", "El id de la entidad es un número.", "entidad_id");
  const r = await sql<{ id: number }>`
    INSERT INTO crm_notas (entidad, entidad_id, autor_id, tipo, cuerpo)
    VALUES (${d.entidad}, ${id}, ${actor?.usuario.id ?? null}, ${tipo}, ${cuerpo}) RETURNING id`;
  const nota = (await notaPorId(r.rows[0].id))!;
  await auditar(actor, "crear", "nota", nota.id, null, { entidad: nota.entidad, entidad_id: nota.entidad_id, tipo, largo: cuerpo.length });
  return nota;
}

export async function notaPorId(id: number): Promise<Nota | null> {
  const r = await sql<Nota>`SELECT n.*, u.nombre AS autor FROM crm_notas n LEFT JOIN crm_usuarios u ON u.id = n.autor_id WHERE n.id = ${id}`;
  return r.rows[0] ?? null;
}

export async function notasDe(entidad: string, entidadId: string | number): Promise<Nota[]> {
  const r = await sql<Nota>`
    SELECT n.*, u.nombre AS autor FROM crm_notas n LEFT JOIN crm_usuarios u ON u.id = n.autor_id
    WHERE n.entidad = ${entidad} AND n.entidad_id = ${String(entidadId)} ORDER BY n.created_at DESC, n.id DESC`;
  return r.rows;
}
