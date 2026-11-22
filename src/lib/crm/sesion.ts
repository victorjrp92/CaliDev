import { jwtVerify, SignJWT } from "jose";

/**
 * Sesión humana del CRM: cookie `crm_sesion` con un JWT firmado con
 * CRM_JWT_SECRET. Lleva el id, el rol y la versión de sesión del usuario;
 * subir `sesion_version` en la base cierra todas sus sesiones a la vez.
 *
 * Sin CRM_JWT_SECRET no hay sesiones: se falla cerrado, nunca con un secreto
 * de respaldo.
 */
export const COOKIE_SESION = "crm_sesion";
export const DURACION_SESION_S = 7 * 24 * 3600;

export type DatosSesion = { usuarioId: number; rol: string; version: number };

function secreto() {
  const s = process.env.CRM_JWT_SECRET;
  if (!s || s.length < 32) throw new Error("Falta CRM_JWT_SECRET (32 caracteres o más) en las variables de entorno.");
  return new TextEncoder().encode(s);
}

export async function firmarSesion(d: DatosSesion): Promise<string> {
  return new SignJWT({ rol: d.rol, v: d.version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(d.usuarioId))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_S}s`)
    .setAudience("crm")
    .sign(secreto());
}

export async function leerSesion(token: string | undefined): Promise<DatosSesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { audience: "crm", algorithms: ["HS256"] });
    const usuarioId = Number(payload.sub);
    if (!Number.isInteger(usuarioId) || typeof payload.rol !== "string" || typeof payload.v !== "number") return null;
    return { usuarioId, rol: payload.rol, version: payload.v };
  } catch {
    return null;
  }
}

export const opcionesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURACION_SESION_S,
};
