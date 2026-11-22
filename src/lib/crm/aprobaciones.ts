import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";
import { exigir } from "./guardia";

/**
 * Cola de Aprobaciones (spec §7). Un agente que quiere hacer algo hacia
 * afuera (mandar un contrato, un cobro, un mensaje) no lo hace: deja aquí la
 * acción con su texto o monto exacto y responde 202. Un humano la aprueba
 * (tal cual o editada) o la rechaza. Al aprobarla se ejecuta y el resultado,
 * bueno o malo, queda en la misma fila.
 *
 * Los tipos ejecutables los registra cada módulo (contratos en 1b, cobros en
 * 1c). Un tipo sin ejecutor se aprueba y queda «aprobada» para hacerse a mano.
 */
export type EstadoAprobacion = "pendiente" | "aprobada" | "rechazada" | "ejecutada" | "fallida";

export type Aprobacion = {
  id: number;
  solicitante_id: number;
  solicitante: string | null;
  tipo: string;
  payload: Record<string, unknown>;
  vista_previa: string;
  entidad: string | null;
  entidad_id: string | null;
  estado: EstadoAprobacion;
  decidido_por: number | null;
  decidido: string | null;
  decidido_at: string | null;
  motivo: string | null;
  resultado: unknown;
  created_at: string;
};

type Ejecutor = (payload: Record<string, unknown>, aprobador: Actor) => Promise<unknown>;
const EJECUTORES = new Map<string, Ejecutor>();

export function registrarEjecutor(tipo: string, fn: Ejecutor) {
  EJECUTORES.set(tipo, fn);
}

export async function aprobacionPorId(id: number): Promise<Aprobacion | null> {
  const r = await sql<Aprobacion>`
    SELECT a.*, s.nombre AS solicitante, d.nombre AS decidido FROM crm_aprobaciones a
    JOIN crm_usuarios s ON s.id = a.solicitante_id LEFT JOIN crm_usuarios d ON d.id = a.decidido_por
    WHERE a.id = ${id}`;
  return r.rows[0] ?? null;
}

export async function listarAprobaciones(estado: string | null = "pendiente", limite = 100): Promise<Aprobacion[]> {
  const lim = Math.min(Math.max(limite, 1), 500);
  const r = await sql<Aprobacion>`
    SELECT a.*, s.nombre AS solicitante, d.nombre AS decidido FROM crm_aprobaciones a
    JOIN crm_usuarios s ON s.id = a.solicitante_id LEFT JOIN crm_usuarios d ON d.id = a.decidido_por
    WHERE (${estado}::text IS NULL OR a.estado = ${estado})
    ORDER BY a.created_at DESC, a.id DESC LIMIT ${lim}`;
  return r.rows;
}

export type Solicitud = { tipo: string; payload: Record<string, unknown>; vistaPrevia: string; entidad?: string | null; entidadId?: string | number | null };

export async function solicitar(actor: Actor, s: Solicitud): Promise<Aprobacion> {
  exigir(actor, "aprobaciones:solicitar");
  const tipo = typeof s.tipo === "string" ? s.tipo.trim() : "";
  if (!/^[a-z_]{3,40}$/.test(tipo)) throw new ErrorCrm(400, "campo_invalido", "tipo: minúsculas y guion bajo (p. ej. enviar_contrato).", "tipo");
  if (!s.payload || typeof s.payload !== "object" || Array.isArray(s.payload)) throw new ErrorCrm(400, "campo_invalido", "payload debe ser un objeto.", "payload");
  const vista = typeof s.vistaPrevia === "string" ? s.vistaPrevia.trim() : "";
  if (!vista) throw new ErrorCrm(400, "campo_requerido", "vista_previa: el texto o monto exacto que se va a mandar, para que quien aprueba vea lo mismo.", "vista_previa");
  const r = await sql<{ id: number }>`
    INSERT INTO crm_aprobaciones (solicitante_id, tipo, payload, vista_previa, entidad, entidad_id)
    VALUES (${actor.usuario.id}, ${tipo}, ${JSON.stringify(s.payload)}, ${vista}, ${s.entidad ?? null},
            ${s.entidadId == null ? null : String(s.entidadId)}) RETURNING id`;
  const a = (await aprobacionPorId(r.rows[0].id))!;
  await auditar(actor, "solicitar", "aprobacion", a.id, null, { tipo, vista_previa: vista, entidad: a.entidad, entidad_id: a.entidad_id });
  return a;
}

export type Decision = { decision: "aprobar" | "rechazar"; motivo?: string | null; payload?: Record<string, unknown> | null };

/**
 * Solo humanos (los agentes no tienen `aprobaciones:decidir`, ni con clave).
 * El paso de «pendiente» a decidida es un UPDATE condicionado: dos personas
 * aprobando a la vez no ejecutan dos veces; la segunda recibe 409.
 */
export async function decidir(actor: Actor, id: number, d: Decision): Promise<Aprobacion> {
  exigir(actor, "aprobaciones:decidir");
  if (actor.usuario.tipo !== "humano") throw new ErrorCrm(403, "sin_permiso", "Solo un humano decide aprobaciones.");
  if (d.decision !== "aprobar" && d.decision !== "rechazar") throw new ErrorCrm(400, "campo_invalido", "decision: aprobar o rechazar.", "decision");
  const antes = await aprobacionPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay aprobación ${id}.`);
  const motivo = d.motivo?.trim() || null;
  if (d.decision === "rechazar" && !motivo) throw new ErrorCrm(400, "campo_requerido", "Al rechazar, di por qué: el agente lo lee.", "motivo");
  const editado = d.decision === "aprobar" && d.payload && typeof d.payload === "object" ? d.payload : null;
  const payload = editado ?? antes.payload;

  const r = await sql`
    UPDATE crm_aprobaciones SET estado = ${d.decision === "aprobar" ? "aprobada" : "rechazada"},
      payload = ${JSON.stringify(payload)}, decidido_por = ${actor.usuario.id}, decidido_at = NOW(), motivo = ${motivo}
    WHERE id = ${id} AND estado = 'pendiente' RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(409, "ya_decidida", `Esta aprobación ya está ${antes.estado}.`);
  await auditar(actor, d.decision === "aprobar" ? (editado ? "aprobar_editada" : "aprobar") : "rechazar", "aprobacion", id,
    { estado: antes.estado, payload: antes.payload }, { estado: d.decision === "aprobar" ? "aprobada" : "rechazada", payload, motivo });

  const ejecutor = d.decision === "aprobar" ? EJECUTORES.get(antes.tipo) : undefined;
  if (ejecutor) {
    let estado: EstadoAprobacion = "ejecutada";
    let resultado: unknown;
    try {
      resultado = await ejecutor(payload, actor);
    } catch (e) {
      estado = "fallida";
      resultado = { error: e instanceof Error ? e.message : String(e) };
    }
    await sql`UPDATE crm_aprobaciones SET estado = ${estado}, resultado = ${JSON.stringify(resultado ?? null)} WHERE id = ${id}`;
    await auditar(actor, estado === "ejecutada" ? "ejecutar" : "fallar", "aprobacion", id, null, { estado, resultado });
  }
  return (await aprobacionPorId(id))!;
}
