import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "../actor";
import { crearUsuario, usuarioPorId } from "../usuarios";

/**
 * Cada agente del CRM es un usuario de tipo agente con rol `agente`: lo que
 * escribe queda auditado a su nombre y los permisos lo frenan igual que a una
 * clave de agente (no gana, no fija precios, no crea cobros, no aprueba).
 * Se crea la primera vez que corre; si alguien lo desactiva, deja de correr.
 */
export const AGENTES = {
  preparacion: "Agente de preparación",
  resumen: "Agente de resumen",
  cobros: "Agente de cobros",
} as const;
export type ClaveAgente = keyof typeof AGENTES;

const correoDe = (clave: ClaveAgente) => `${clave}@agentes.calidev.dev`;

export async function actorDeAgente(clave: ClaveAgente): Promise<Actor> {
  const correo = correoDe(clave);
  let id = (await sql<{ id: number }>`SELECT id FROM crm_usuarios WHERE correo = ${correo}`.catch(() => ({ rows: [] as { id: number }[] }))).rows[0]?.id;
  if (!id) {
    try {
      id = (await crearUsuario(null, { nombre: AGENTES[clave], correo, tipo: "agente", rol: "agente" })).usuario.id;
    } catch (e) {
      // Dos corridas a la vez: la otra lo creó primero.
      if ((e as ErrorCrm).codigo !== "ya_existe") throw e;
      id = (await sql<{ id: number }>`SELECT id FROM crm_usuarios WHERE correo = ${correo}`).rows[0]?.id;
    }
  }
  const u = id ? await usuarioPorId(id) : null;
  if (!u) throw new ErrorCrm(500, "sin_agente", `No se pudo crear el usuario de ${AGENTES[clave]}.`);
  if (!u.activo) throw new ErrorCrm(403, "agente_inactivo", `${AGENTES[clave]} está desactivado en Ajustes → Agentes.`);
  const usuario = { id: u.id, nombre: u.nombre, correo: u.correo, tipo: u.tipo, rol: u.rol, activo: u.activo };
  return { usuario, origen: "agente", alcances: null, claveId: null };
}
