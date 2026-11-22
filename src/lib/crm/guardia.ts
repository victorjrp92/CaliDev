import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { type Actor, ErrorCrm, type Usuario } from "./actor";
import { partirClave, secretoCorrecto } from "./claves";
import { asegurarEsquema } from "./esquema";
import { type Permiso, tienePermiso } from "./permisos";
import { COOKIE_SESION, leerSesion } from "./sesion";
import { usuarioPorId } from "./usuarios";

/**
 * El único guardia de /api/crm/v1 (spec §6). Acepta dos entradas:
 * - `Authorization: Bearer cdv_…` (agentes y CLI): se busca la clave por
 *   prefijo y se compara el hash en tiempo constante. Sus alcances limitan
 *   al rol.
 * - la cookie `crm_sesion` (navegador). En escrituras con cookie se exige que
 *   el Origin sea el mismo sitio: sameSite=lax ya frena casi todo, esto cierra
 *   lo que queda.
 */

function cookieDe(request: Request, nombre: string): string | undefined {
  const crudo = request.headers.get("cookie");
  if (!crudo) return undefined;
  for (const parte of crudo.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return undefined;
}

type FilaClave = { id: number; usuario_id: number; hash: string; alcances: string[]; expira_at: string | null; revocada_at: string | null };

async function actorPorClave(bearer: string): Promise<Actor> {
  const partes = partirClave(bearer);
  if (!partes) throw new ErrorCrm(401, "clave_invalida", "La clave no tiene el formato cdv_<prefijo>_<secreto>. Corre `calidev login` otra vez.");
  const r = await sql<FilaClave>`SELECT id, usuario_id, hash, alcances, expira_at, revocada_at FROM crm_claves WHERE prefijo = ${partes.prefijo}`;
  const c = r.rows[0];
  // Se compara aunque no exista la fila, con un hash de relleno, para no delatar prefijos por el tiempo.
  const ok = secretoCorrecto(partes.secreto, c?.hash ?? "0".repeat(64));
  if (!c || !ok) throw new ErrorCrm(401, "clave_invalida", "Clave desconocida. Pide una nueva en Agentes → Claves.");
  if (c.revocada_at) throw new ErrorCrm(401, "clave_revocada", "Esta clave fue revocada. Pide una nueva en Agentes → Claves.");
  if (c.expira_at && Date.parse(c.expira_at) < Date.now()) throw new ErrorCrm(401, "clave_vencida", "Esta clave venció. Pide una nueva en Agentes → Claves.");
  const u = await usuarioPorId(c.usuario_id);
  if (!u || !u.activo) throw new ErrorCrm(401, "usuario_inactivo", "El usuario de esta clave está desactivado.");
  sql`UPDATE crm_claves SET ultimo_uso_at = NOW() WHERE id = ${c.id}`.catch(() => {});
  return { usuario: limpiar(u), origen: u.tipo === "agente" ? (u.rol === "sistema" ? "sistema" : "agente") : "cli", alcances: c.alcances, claveId: c.id };
}

const limpiar = (u: Usuario): Usuario => ({ id: u.id, nombre: u.nombre, correo: u.correo, tipo: u.tipo, rol: u.rol, activo: u.activo });

/** El actor de la cookie de sesión, o null si no hay sesión válida. También lo usan las páginas. */
export async function actorPorCookie(token: string | undefined): Promise<Actor | null> {
  const s = await leerSesion(token);
  if (!s) return null;
  const u = await usuarioPorId(s.usuarioId);
  if (!u || !u.activo || u.tipo !== "humano" || u.sesion_version !== s.version) return null;
  return { usuario: limpiar(u), origen: "ui", alcances: null, claveId: null };
}

function mismoOrigen(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Quién hace la petición, sin mirar permisos. 401 si nadie. */
export async function autenticar(request: Request): Promise<Actor> {
  await asegurarEsquema();
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return actorPorClave(auth.slice(7));
  const actor = await actorPorCookie(cookieDe(request, COOKIE_SESION));
  if (!actor) throw new ErrorCrm(401, "sin_sesion", "Entra en /crm/entrar o pasa una clave con Authorization: Bearer cdv_…");
  const escritura = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (escritura && !mismoOrigen(request)) throw new ErrorCrm(403, "origen_invalido", "Petición desde otro sitio: se rechaza.");
  return actor;
}

export function puede(actor: Actor, permiso: Permiso): boolean {
  return tienePermiso(actor.usuario, actor.alcances, permiso);
}

export function exigir(actor: Actor, permiso: Permiso): void {
  if (!puede(actor, permiso)) {
    const por = actor.alcances ? "tu clave o tu rol" : "tu rol";
    throw new ErrorCrm(403, "sin_permiso", `Te falta el permiso ${permiso} (${por} no lo da).`);
  }
}

/** Autentica y exige un permiso. Devuelve el actor para la auditoría. */
export async function requerir(request: Request, permiso: Permiso): Promise<Actor> {
  const actor = await autenticar(request);
  exigir(actor, permiso);
  return actor;
}

export function errorJson(e: unknown): NextResponse {
  if (e instanceof ErrorCrm) {
    return NextResponse.json({ error: { codigo: e.codigo, mensaje: e.message, ...(e.campo ? { campo: e.campo } : {}) } }, { status: e.estado });
  }
  console.error("[crm]", e);
  return NextResponse.json({ error: { codigo: "interno", mensaje: "Error interno. Quedó en los logs del servidor." } }, { status: 500 });
}

type Contexto<P> = { params: Promise<P> };

/**
 * Envuelve un handler: convierte ErrorCrm en la respuesta de error de la API
 * y lo demás en un 500 sin filtrar detalles.
 */
export function api<P = Record<string, never>>(fn: (request: Request, ctx: Contexto<P>) => Promise<Response>) {
  return async (request: Request, ctx: Contexto<P>) => {
    try {
      return await fn(request, ctx);
    } catch (e) {
      return errorJson(e);
    }
  };
}

/**
 * Escrituras con `Idempotency-Key`: si el mismo usuario repite la clave, se
 * devuelve la respuesta guardada en vez de volver a ejecutar. La fila se
 * reserva antes de ejecutar (estado 0), así que dos reintentos simultáneos no
 * ejecutan dos veces: el segundo recibe 409.
 */
export async function idempotente(actor: Actor, request: Request, fn: () => Promise<{ estado: number; cuerpo: unknown }>): Promise<Response> {
  const clave = request.headers.get("idempotency-key")?.trim().slice(0, 200);
  if (!clave) {
    const r = await fn();
    return NextResponse.json(r.cuerpo, { status: r.estado });
  }
  const reserva = await sql`
    INSERT INTO crm_idempotencia (usuario_id, clave, estado, respuesta) VALUES (${actor.usuario.id}, ${clave}, 0, ${"{}"})
    ON CONFLICT DO NOTHING RETURNING clave`;
  if (!reserva.rows[0]) {
    const previa = await sql<{ estado: number; respuesta: unknown }>`
      SELECT estado, respuesta FROM crm_idempotencia WHERE usuario_id = ${actor.usuario.id} AND clave = ${clave}`;
    const p = previa.rows[0];
    if (!p || p.estado === 0) throw new ErrorCrm(409, "en_curso", "Esa Idempotency-Key se está procesando. Reintenta en unos segundos.");
    return NextResponse.json(p.respuesta, { status: p.estado, headers: { "Idempotent-Replay": "true" } });
  }
  try {
    const r = await fn();
    await sql`UPDATE crm_idempotencia SET estado = ${r.estado}, respuesta = ${JSON.stringify(r.cuerpo)}
              WHERE usuario_id = ${actor.usuario.id} AND clave = ${clave}`;
    return NextResponse.json(r.cuerpo, { status: r.estado });
  } catch (e) {
    // Si falló, la clave se libera: el reintento debe poder ejecutar.
    await sql`DELETE FROM crm_idempotencia WHERE usuario_id = ${actor.usuario.id} AND clave = ${clave}`;
    throw e;
  }
}

/** Lee el cuerpo JSON; un cuerpo roto es un 400 claro, no un 500. */
export async function cuerpo(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    if (b && typeof b === "object" && !Array.isArray(b)) return b as Record<string, unknown>;
  } catch {}
  throw new ErrorCrm(400, "json_invalido", "El cuerpo debe ser un objeto JSON.");
}
