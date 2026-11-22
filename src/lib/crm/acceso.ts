import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ErrorCrm, type Usuario } from "./actor";
import { auditar } from "./auditoria";
import { asegurarEsquema } from "./esquema";
import { COOKIE_SESION, firmarSesion, opcionesCookie } from "./sesion";
import { entrar } from "./usuarios";

/**
 * Entrada de humanos al CRM. Los intentos fallidos se cuentan por correo en la
 * auditoría (no en memoria: en Vercel cada función tiene la suya). Pasados
 * MAX_FALLOS en VENTANA_MIN minutos, se rechaza sin mirar la contraseña.
 */
const MAX_FALLOS = 8;
const VENTANA_MIN = 15;

export async function entrarConLimite(correo: string, contrasena: string): Promise<Usuario & { sesion_version: number }> {
  await asegurarEsquema();
  const c = correo.trim().toLowerCase().slice(0, 160);
  const fallos = await sql<{ n: string | number }>`
    SELECT COUNT(*) AS n FROM crm_auditoria
    WHERE accion = 'sesion.fallo' AND entidad = 'acceso' AND entidad_id = ${c}
      AND at > NOW() - make_interval(mins => ${VENTANA_MIN})`;
  if (Number(fallos.rows[0]?.n ?? 0) >= MAX_FALLOS) {
    throw new ErrorCrm(429, "demasiados_intentos", `Demasiados intentos fallidos. Espera ${VENTANA_MIN} minutos o pide a Victor una invitación nueva.`);
  }
  const u = await entrar(c, contrasena);
  if (!u) {
    await auditar(null, "sesion.fallo", "acceso", c, null, null);
    throw new ErrorCrm(401, "credenciales", "Correo o contraseña incorrectos.");
  }
  await auditar({ usuario: u, origen: "ui", alcances: null, claveId: null }, "sesion.entrar", "usuario", u.id, null, null);
  return u;
}

/** Respuesta con la cookie de sesión puesta. */
export async function conSesion(u: Usuario & { sesion_version: number }, cuerpo: unknown): Promise<NextResponse> {
  const token = await firmarSesion({ usuarioId: u.id, rol: u.rol, version: u.sesion_version });
  const r = NextResponse.json(cuerpo);
  r.cookies.set(COOKIE_SESION, token, opcionesCookie);
  return r;
}

export function sinSesion(): NextResponse {
  const r = NextResponse.json({ ok: true });
  r.cookies.set(COOKIE_SESION, "", { ...opcionesCookie, maxAge: 0 });
  return r;
}
