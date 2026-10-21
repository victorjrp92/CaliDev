import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import type { Respuestas } from "@/lib/arranque/esquema";

/**
 * Formularios de arranque en la base: uno por cliente, con su enlace
 * personal (`token`). Las respuestas se guardan como texto JSON por sección a
 * medida que la persona avanza, así puede dejarlo a medias y volver.
 * `enviado_at` es cuándo pulsó «Enviar a CaliDev».
 */
export type Arranque = {
  id: number;
  token: string;
  cliente: string;
  negocio: string | null;
  respuestas: string;
  enviado_at: string | null;
  created_at: string;
  updated_at: string;
};

let tabla: Promise<unknown> | null = null;
function asegurarTabla() {
  tabla ??= sql`
    CREATE TABLE IF NOT EXISTS arranques (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      cliente TEXT NOT NULL,
      negocio TEXT,
      respuestas TEXT NOT NULL DEFAULT '{}',
      enviado_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch((err) => {
    tabla = null;
    throw err;
  });
  return tabla;
}

export function respuestasDe(a: Arranque): Respuestas {
  try {
    return JSON.parse(a.respuestas) as Respuestas;
  } catch {
    return {};
  }
}

export async function crearArranque(cliente: string, negocio: string | null): Promise<Arranque> {
  await asegurarTabla();
  const token = randomBytes(16).toString("hex");
  const r = await sql<Arranque>`INSERT INTO arranques (token, cliente, negocio) VALUES (${token}, ${cliente}, ${negocio}) RETURNING *`;
  return r.rows[0];
}

export async function arranquePorToken(token: string): Promise<Arranque | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  await asegurarTabla();
  const r = await sql<Arranque>`SELECT * FROM arranques WHERE token = ${token}`;
  return r.rows[0] ?? null;
}

export async function arranquePorId(id: number): Promise<Arranque | null> {
  await asegurarTabla();
  const r = await sql<Arranque>`SELECT * FROM arranques WHERE id = ${id}`;
  return r.rows[0] ?? null;
}

export async function todosLosArranques(): Promise<Arranque[]> {
  await asegurarTabla();
  const r = await sql<Arranque>`SELECT * FROM arranques ORDER BY created_at DESC`;
  return r.rows;
}

export async function guardarRespuestas(id: number, respuestas: Respuestas): Promise<void> {
  await sql`UPDATE arranques SET respuestas = ${JSON.stringify(respuestas)}, updated_at = NOW() WHERE id = ${id}`;
}

export async function marcarEnviado(id: number): Promise<void> {
  await sql`UPDATE arranques SET enviado_at = COALESCE(enviado_at, NOW()), updated_at = NOW() WHERE id = ${id}`;
}

export async function borrarArranque(id: number): Promise<boolean> {
  await asegurarTabla();
  const r = await sql`DELETE FROM arranques WHERE id = ${id}`;
  return (r.rowCount ?? 0) > 0;
}
