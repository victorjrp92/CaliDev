import { sql } from "@/lib/db";
import type { Actor } from "./actor";

/**
 * Toda escritura del CRM deja una fila aquí: quién, desde dónde, qué hizo, a
 * qué y cómo quedó (spec §1.4). La tabla solo admite INSERT; un trigger
 * rechaza cualquier UPDATE o DELETE.
 */
export async function auditar(
  actor: Actor | null,
  accion: string,
  entidad: string,
  entidadId: string | number | null,
  antes: unknown,
  despues: unknown,
): Promise<void> {
  await sql`
    INSERT INTO crm_auditoria (usuario_id, origen, accion, entidad, entidad_id, antes, despues)
    VALUES (${actor?.usuario.id ?? null}, ${actor?.origen ?? "sistema"}, ${accion}, ${entidad},
            ${entidadId === null ? null : String(entidadId)},
            ${antes === undefined || antes === null ? null : JSON.stringify(antes)},
            ${despues === undefined || despues === null ? null : JSON.stringify(despues)})`;
}

export type FilaAuditoria = {
  id: string;
  usuario_id: number | null;
  usuario: string | null;
  origen: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  antes: unknown;
  despues: unknown;
  at: string;
};

export async function listarAuditoria(f: { entidad?: string; id?: string; limite?: number }): Promise<FilaAuditoria[]> {
  const limite = Math.min(Math.max(f.limite ?? 50, 1), 500);
  const r = await sql<FilaAuditoria>`
    SELECT a.*, u.nombre AS usuario FROM crm_auditoria a LEFT JOIN crm_usuarios u ON u.id = a.usuario_id
    WHERE (${f.entidad ?? null}::text IS NULL OR a.entidad = ${f.entidad ?? null})
      AND (${f.id ?? null}::text IS NULL OR a.entidad_id = ${f.id ?? null})
    ORDER BY a.at DESC, a.id DESC LIMIT ${limite}`;
  return r.rows;
}
