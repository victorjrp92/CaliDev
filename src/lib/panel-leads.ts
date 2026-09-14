import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Puerta del panel de leads de campaña.
 *
 * Es una contraseña compartida, a propósito: la piden Victor y quien le ayude a
 * llamar, y montar usuarios para dos personas es fricción sin beneficio. Por lo
 * mismo NO reutiliza el login de administrador del sitio — ese da acceso a
 * contenido, pagos y testimonios, y una contraseña que se comparte no debería
 * abrir todo eso.
 *
 * La contraseña nunca viaja en la cookie: lo que se guarda es un token firmado
 * con el mismo secreto del sitio, así que no se puede fabricar desde el
 * navegador.
 */
const COOKIE = "panel_leads";
const DURACION_DIAS = 30;

function secreto() {
  const valor = process.env.ADMIN_JWT_SECRET;
  if (!valor) throw new Error("Falta ADMIN_JWT_SECRET");
  return new TextEncoder().encode(valor);
}

/**
 * Comparación en tiempo constante. Con `===` el tiempo de respuesta cambia
 * según cuántos caracteres coinciden, y eso deja adivinar la contraseña letra a
 * letra. Cuesta cuatro líneas evitarlo.
 */
function igualSinFiltrarTiempo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/** Si no hay contraseña puesta, el panel se declara sin configurar en vez de rechazar a ciegas. */
export function panelConfigurado(): boolean {
  return Boolean(process.env.PANEL_LEADS_PASSWORD);
}

export function contrasenaCorrecta(intento: string): boolean {
  const real = process.env.PANEL_LEADS_PASSWORD;
  if (!real) return false;
  return igualSinFiltrarTiempo(intento, real);
}

export async function abrirPanel() {
  const token = await new SignJWT({ panel: "leads" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${DURACION_DIAS}d`)
    .sign(secreto());

  const galletas = await cookies();
  galletas.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * DURACION_DIAS,
    path: "/servinomic",
  });
}

export async function cerrarPanel() {
  const galletas = await cookies();
  galletas.delete({ name: COOKIE, path: "/servinomic" });
}

export async function panelAbierto(): Promise<boolean> {
  const galletas = await cookies();
  const token = galletas.get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secreto());
    return payload.panel === "leads";
  } catch {
    return false;
  }
}
