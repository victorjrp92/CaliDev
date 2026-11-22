import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { type Actor, ErrorCrm, type Usuario } from "./actor";
import { auditar } from "./auditoria";
import { generarClave, generarToken, hashSecreto } from "./claves";
import { asegurarEsquema } from "./esquema";
import { alcancesValidos, esRol, ROLES_AGENTE, ROLES_HUMANOS, type Rol, type TipoUsuario } from "./permisos";

/**
 * Usuarios del CRM: Victor y Karen (humanos) y los agentes. Los humanos entran
 * por un enlace de invitación de un solo uso en el que eligen su contraseña;
 * nadie más la conoce ni la escribe. Los agentes no tienen contraseña: usan
 * claves `cdv_…` que crea un humano y por las que ese humano responde.
 */
const RONDAS = 12;
const INVITACION_DIAS = 7;
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Hash de relleno: si el correo no existe se compara igual, para no delatar por el tiempo qué correos hay.
let relleno: Promise<string> | null = null;
const hashRelleno = () => (relleno ??= bcrypt.hash("relleno, no es la clave de nadie", RONDAS));

type FilaUsuario = Usuario & {
  hash_clave: string | null;
  sesion_version: number;
  invitacion_hash: string | null;
  invitacion_expira_at: string | null;
};

const publico = (u: FilaUsuario): Usuario => ({
  id: u.id, nombre: u.nombre, correo: u.correo, tipo: u.tipo, rol: u.rol, activo: u.activo,
});

export async function usuarioPorId(id: number): Promise<(Usuario & { sesion_version: number }) | null> {
  await asegurarEsquema();
  const r = await sql<FilaUsuario>`SELECT * FROM crm_usuarios WHERE id = ${id}`;
  const u = r.rows[0];
  return u ? { ...publico(u), sesion_version: u.sesion_version } : null;
}

export async function listarUsuarios(): Promise<(Usuario & { invitacion_pendiente: boolean })[]> {
  await asegurarEsquema();
  const r = await sql<FilaUsuario>`SELECT * FROM crm_usuarios ORDER BY tipo, id`;
  return r.rows.map((u) => ({ ...publico(u), invitacion_pendiente: !u.hash_clave && u.tipo === "humano" && !!u.invitacion_hash }));
}

/**
 * Crea un usuario. Si es humano devuelve el token de invitación (se muestra
 * una vez y se manda a la persona); si es agente no hay invitación, se le
 * crea una clave aparte.
 */
export async function crearUsuario(
  actor: Actor | null,
  d: { nombre: string; correo: string; tipo: TipoUsuario; rol: string },
): Promise<{ usuario: Usuario; invitacion: string | null }> {
  await asegurarEsquema();
  const nombre = d.nombre.trim().slice(0, 120);
  const correo = d.correo.trim().toLowerCase().slice(0, 160);
  if (nombre.length < 2) throw new ErrorCrm(400, "dato_invalido", "Falta el nombre.", "nombre");
  if (!CORREO_OK.test(correo)) throw new ErrorCrm(400, "dato_invalido", "El correo no es válido.", "correo");
  if (!esRol(d.rol)) throw new ErrorCrm(400, "dato_invalido", "Rol desconocido: usa dueno, socia, agente o sistema.", "rol");
  const rolesDelTipo: Rol[] = d.tipo === "humano" ? ROLES_HUMANOS : ROLES_AGENTE;
  if (!rolesDelTipo.includes(d.rol)) {
    throw new ErrorCrm(400, "dato_invalido", `Un usuario ${d.tipo} solo puede tener rol ${rolesDelTipo.join(" o ")}.`, "rol");
  }
  const inv = d.tipo === "humano" ? generarToken() : null;
  const expira = inv ? new Date(Date.now() + INVITACION_DIAS * 864e5).toISOString() : null;
  const r = await sql<FilaUsuario>`
    INSERT INTO crm_usuarios (nombre, correo, tipo, rol, invitacion_hash, invitacion_expira_at, creado_por)
    VALUES (${nombre}, ${correo}, ${d.tipo}, ${d.rol}, ${inv?.hash ?? null}, ${expira}, ${actor?.usuario.id ?? null})
    ON CONFLICT (correo) DO NOTHING
    RETURNING *`;
  if (!r.rows[0]) throw new ErrorCrm(409, "ya_existe", `Ya hay un usuario con el correo ${correo}.`, "correo");
  const usuario = publico(r.rows[0]);
  await auditar(actor, "usuario.crear", "usuario", usuario.id, null, usuario);
  return { usuario, invitacion: inv?.token ?? null };
}

/**
 * Vuelve a generar la invitación de un humano que aún no eligió contraseña (o
 * que la olvidó). El enlace anterior deja de servir. `actor` es null cuando lo
 * corre el script de siembra.
 */
export async function reinvitar(actor: Actor | null, usuarioId: number): Promise<string> {
  await asegurarEsquema();
  const inv = generarToken();
  const expira = new Date(Date.now() + INVITACION_DIAS * 864e5).toISOString();
  const r = await sql<FilaUsuario>`
    UPDATE crm_usuarios SET invitacion_hash = ${inv.hash}, invitacion_expira_at = ${expira}
    WHERE id = ${usuarioId} AND tipo = 'humano' RETURNING *`;
  if (!r.rows[0]) throw new ErrorCrm(404, "no_existe", "No hay un usuario humano con ese id.");
  await auditar(actor, "usuario.reinvitar", "usuario", usuarioId, null, { expira });
  return inv.token;
}

export async function invitacionVigente(token: string): Promise<Usuario | null> {
  await asegurarEsquema();
  const r = await sql<FilaUsuario>`
    SELECT * FROM crm_usuarios
    WHERE invitacion_hash = ${hashSecreto(token)} AND invitacion_expira_at > NOW() AND activo AND tipo = 'humano'`;
  return r.rows[0] ? publico(r.rows[0]) : null;
}

/**
 * La persona invitada elige su contraseña. El token se borra en la misma
 * sentencia: dos envíos a la vez no pueden usarlo dos veces. Sube la versión
 * de sesión, así que cualquier sesión anterior queda cerrada.
 */
export async function aceptarInvitacion(token: string, contrasena: string): Promise<Usuario & { sesion_version: number }> {
  await asegurarEsquema();
  if (contrasena.length < 10) throw new ErrorCrm(400, "dato_invalido", "La contraseña necesita al menos 10 caracteres.", "contrasena");
  if (contrasena.length > 200) throw new ErrorCrm(400, "dato_invalido", "La contraseña es demasiado larga.", "contrasena");
  const hash = await bcrypt.hash(contrasena, RONDAS);
  const r = await sql<FilaUsuario>`
    UPDATE crm_usuarios
    SET hash_clave = ${hash}, invitacion_hash = NULL, invitacion_expira_at = NULL, sesion_version = sesion_version + 1
    WHERE invitacion_hash = ${hashSecreto(token)} AND invitacion_expira_at > NOW() AND activo AND tipo = 'humano'
    RETURNING *`;
  const u = r.rows[0];
  if (!u) throw new ErrorCrm(400, "invitacion_invalida", "El enlace ya se usó o venció. Pide uno nuevo a Victor.");
  const usuario = publico(u);
  await auditar({ usuario, origen: "ui", alcances: null, claveId: null }, "usuario.aceptar_invitacion", "usuario", u.id, null, { ok: true });
  return { ...usuario, sesion_version: u.sesion_version };
}

export async function entrar(correo: string, contrasena: string): Promise<(Usuario & { sesion_version: number }) | null> {
  await asegurarEsquema();
  const r = await sql<FilaUsuario>`
    SELECT * FROM crm_usuarios WHERE correo = ${correo.trim().toLowerCase()} AND tipo = 'humano' AND activo`;
  const u = r.rows[0];
  const ok = await bcrypt.compare(contrasena.slice(0, 200), u?.hash_clave ?? (await hashRelleno()));
  if (!u || !u.hash_clave || !ok) return null;
  return { ...publico(u), sesion_version: u.sesion_version };
}

/** Cierra todas las sesiones de un usuario (salir en todos lados, o al desactivarlo). */
export async function cerrarSesiones(actor: Actor, usuarioId: number): Promise<void> {
  await sql`UPDATE crm_usuarios SET sesion_version = sesion_version + 1 WHERE id = ${usuarioId}`;
  await auditar(actor, "usuario.cerrar_sesiones", "usuario", usuarioId, null, null);
}

export async function cambiarActivo(actor: Actor, usuarioId: number, activo: boolean): Promise<void> {
  if (usuarioId === actor.usuario.id && !activo) throw new ErrorCrm(400, "dato_invalido", "No puedes desactivarte a ti mismo.");
  const r = await sql`UPDATE crm_usuarios SET activo = ${activo}, sesion_version = sesion_version + 1 WHERE id = ${usuarioId}`;
  if (!r.rowCount) throw new ErrorCrm(404, "no_existe", "No hay un usuario con ese id.");
  await sql`UPDATE crm_claves SET revocada_at = NOW() WHERE usuario_id = ${usuarioId} AND revocada_at IS NULL AND ${!activo}`;
  await auditar(actor, activo ? "usuario.activar" : "usuario.desactivar", "usuario", usuarioId, null, { activo });
}

// ── Claves ──────────────────────────────────────────────────────────────────

export type ClavePublica = {
  id: number;
  usuario_id: number;
  usuario: string;
  nombre: string;
  prefijo: string;
  alcances: string[];
  expira_at: string | null;
  ultimo_uso_at: string | null;
  revocada_at: string | null;
  created_at: string;
};

/**
 * Crea una clave para `usuarioId`. Victor crea claves para cualquiera; Karen
 * solo para sí misma (`claves:propias`). Los alcances se recortan al rol del
 * dueño de la clave: pedir más es un error, no un permiso silencioso.
 * La clave completa se devuelve una sola vez.
 */
export async function crearClaveDe(
  actor: Actor,
  d: { usuarioId: number; nombre: string; alcances: string[]; diasVigencia?: number | null },
  puedeAjenas: boolean,
): Promise<{ clave: string; registro: ClavePublica }> {
  await asegurarEsquema();
  if (!puedeAjenas && d.usuarioId !== actor.usuario.id) {
    throw new ErrorCrm(403, "sin_permiso", "Solo puedes crear claves para ti. Pide a Victor la de un agente.");
  }
  const dueno = await usuarioPorId(d.usuarioId);
  if (!dueno || !dueno.activo) throw new ErrorCrm(404, "no_existe", "El usuario no existe o está desactivado.", "usuario_id");
  if (!esRol(dueno.rol)) throw new ErrorCrm(400, "dato_invalido", "El usuario tiene un rol desconocido.");
  const alcances = d.alcances.length ? d.alcances : ["*"];
  const { invalidos } = alcancesValidos(dueno.rol, dueno.tipo, alcances);
  if (invalidos.length) {
    throw new ErrorCrm(400, "alcance_invalido", `El rol ${dueno.rol} no tiene: ${invalidos.join(", ")}. Quítalos de la clave.`, "alcances");
  }
  const nombre = d.nombre.trim().slice(0, 80) || "clave";
  const expira = d.diasVigencia ? new Date(Date.now() + d.diasVigencia * 864e5).toISOString() : null;
  const g = generarClave();
  const r = await sql<ClavePublica>`
    INSERT INTO crm_claves (usuario_id, nombre, prefijo, hash, alcances, creada_por, expira_at)
    VALUES (${d.usuarioId}, ${nombre}, ${g.prefijo}, ${g.hash}, ${alcances}, ${actor.usuario.id}, ${expira})
    RETURNING id, usuario_id, nombre, prefijo, alcances, expira_at, ultimo_uso_at, revocada_at, created_at`;
  const registro = { ...r.rows[0], usuario: dueno.nombre };
  await auditar(actor, "clave.crear", "clave", registro.id, null, { usuario_id: d.usuarioId, prefijo: g.prefijo, alcances, expira });
  return { clave: g.clave, registro };
}

export async function listarClaves(usuarioId?: number): Promise<ClavePublica[]> {
  await asegurarEsquema();
  const r = await sql<ClavePublica>`
    SELECT c.id, c.usuario_id, u.nombre AS usuario, c.nombre, c.prefijo, c.alcances, c.expira_at,
           c.ultimo_uso_at, c.revocada_at, c.created_at
    FROM crm_claves c JOIN crm_usuarios u ON u.id = c.usuario_id
    WHERE (${usuarioId ?? null}::int IS NULL OR c.usuario_id = ${usuarioId ?? null})
    ORDER BY c.revocada_at NULLS FIRST, c.created_at DESC`;
  return r.rows;
}

export async function revocarClave(actor: Actor, claveId: number, puedeAjenas: boolean): Promise<void> {
  const r = await sql<{ usuario_id: number }>`
    UPDATE crm_claves SET revocada_at = NOW()
    WHERE id = ${claveId} AND revocada_at IS NULL AND (${puedeAjenas} OR usuario_id = ${actor.usuario.id})
    RETURNING usuario_id`;
  if (!r.rows[0]) throw new ErrorCrm(404, "no_existe", "No hay una clave activa con ese id que puedas revocar.");
  await auditar(actor, "clave.revocar", "clave", claveId, null, { revocada: true });
}
