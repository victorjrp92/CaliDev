import { NextResponse } from "next/server";
import { ErrorCrm } from "./actor";

/**
 * Lectura de entradas de /api/crm/v1: un campo mal puesto es un 400 que nombra
 * el campo, nunca un 500 ni un valor convertido en silencio.
 */
type Cuerpo = Record<string, unknown>;

export const ok = (cuerpo: unknown, estado = 200) => NextResponse.json(cuerpo, { status: estado });

/** Id numérico de un segmento de ruta (`/personas/[id]`). */
export function idDe(v: string | undefined, campo = "id"): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un entero positivo.`, campo);
  return n;
}

export function texto(b: Cuerpo, campo: string, o: { requerido?: boolean; max?: number } = {}): string | null | undefined {
  const v = b[campo];
  if (v === undefined) {
    if (o.requerido) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo}.`, campo);
    return undefined;
  }
  if (v === null) {
    if (o.requerido) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo}.`, campo);
    return null;
  }
  if (typeof v !== "string") throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser texto.`, campo);
  const t = v.trim();
  if (o.requerido && !t) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo}.`, campo);
  if (o.max && t.length > o.max) throw new ErrorCrm(400, "campo_invalido", `${campo}: máximo ${o.max} caracteres.`, campo);
  return t;
}

/** Texto obligatorio: atajo para no repetir `!`. */
export const textoReq = (b: Cuerpo, campo: string, max?: number) => texto(b, campo, { requerido: true, max }) as string;

export function entero(b: Cuerpo, campo: string): number | null | undefined {
  const v = b[campo];
  if (v === undefined || v === null) return v as null | undefined;
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n)) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un entero.`, campo);
  return n;
}

export function booleano(b: Cuerpo, campo: string): boolean | undefined {
  const v = b[campo];
  if (v === undefined) return undefined;
  if (typeof v !== "boolean") throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser true o false.`, campo);
  return v;
}

export function objeto(b: Cuerpo, campo: string): Record<string, unknown> | null | undefined {
  const v = b[campo];
  if (v === undefined || v === null) return v as null | undefined;
  if (typeof v !== "object" || Array.isArray(v)) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un objeto.`, campo);
  return v as Record<string, unknown>;
}

export function listaTexto(b: Cuerpo, campo: string): string[] | undefined {
  const v = b[campo];
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser una lista de textos.`, campo);
  return v as string[];
}

/** Parámetros de la URL (`?q=…&limite=…`). */
export function consulta(request: Request) {
  const p = new URL(request.url).searchParams;
  return {
    texto: (k: string) => p.get(k)?.trim() || null,
    entero: (k: string) => {
      const v = p.get(k);
      if (v === null || v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n)) throw new ErrorCrm(400, "campo_invalido", `?${k} debe ser un entero.`, k);
      return n;
    },
    si: (k: string) => p.has(k) && p.get(k) !== "0" && p.get(k) !== "false",
  };
}

/** Contraseña tal cual (sin recortar espacios: son parte de ella). */
export function contrasena(b: Cuerpo, campo = "contrasena"): string {
  const v = b[campo];
  if (typeof v !== "string" || !v) throw new ErrorCrm(400, "campo_requerido", "Falta la contraseña.", campo);
  if (v.length > 200) throw new ErrorCrm(400, "campo_invalido", "La contraseña es demasiado larga.", campo);
  return v;
}

/** Enlace de invitación que se manda a la persona (un solo uso). */
export const enlaceInvitacion = (request: Request, token: string) => `${new URL(request.url).origin}/crm/invitacion/${token}`;
