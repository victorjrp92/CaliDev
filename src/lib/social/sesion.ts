import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Puerta de calidev.dev/social. Contraseña propia (PANEL_SOCIAL_PASSWORD), a
 * propósito separada del admin del sitio y del panel de leads: desde aquí se
 * escribe en el Instagram de Calidev, y esa llave no debe abrir pagos ni
 * contenido, ni al revés. Mismo patrón que src/lib/panel-leads.ts.
 *
 * La cookie va con path "/" porque la usan tanto las páginas (/social) como
 * las rutas de API (/api/social); lo que distingue el panel es el payload.
 */
const COOKIE = "panel_social";
const DURACION_DIAS = 30;

function secreto() {
  const valor = process.env.ADMIN_JWT_SECRET;
  if (!valor) throw new Error("Falta ADMIN_JWT_SECRET");
  return new TextEncoder().encode(valor);
}

/** Comparación en tiempo constante: con `===` se puede adivinar letra a letra. */
function igualSinFiltrarTiempo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export function panelConfigurado(): boolean {
  return Boolean(process.env.PANEL_SOCIAL_PASSWORD);
}

export function contrasenaCorrecta(intento: string): boolean {
  const real = process.env.PANEL_SOCIAL_PASSWORD;
  if (!real) return false;
  return igualSinFiltrarTiempo(intento, real);
}

export async function abrirPanel() {
  const token = await new SignJWT({ panel: "social" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${DURACION_DIAS}d`)
    .sign(secreto());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * DURACION_DIAS,
    path: "/",
  });
}

export async function cerrarPanel() {
  (await cookies()).delete({ name: COOKIE, path: "/" });
}

export async function panelAbierto(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secreto());
    return payload.panel === "social";
  } catch {
    return false;
  }
}

/** Para rutas de API: devuelve la respuesta 401 lista, o null si hay sesión. */
export async function sinSesion(): Promise<NextResponse | null> {
  return (await panelAbierto()) ? null : NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
