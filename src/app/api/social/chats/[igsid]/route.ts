import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sinSesion } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";

/**
 * Datos de Victor sobre una persona: nota, etiquetas y pausa del agente.
 * Pausar = paso "revision": el agente solo actúa en los pasos automáticos.
 */
export async function POST(peticion: Request, { params }: { params: Promise<{ igsid: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  const { igsid } = await params;
  const b = await peticion.json().catch(() => ({}));
  if (typeof b.nota === "string") await sql`UPDATE social_personas SET nota = ${b.nota.slice(0, 2000)} WHERE igsid = ${igsid}`;
  if (Array.isArray(b.etiquetas)) {
    const e = b.etiquetas.filter((x: unknown) => typeof x === "string").slice(0, 10).map((x: string) => x.slice(0, 30));
    await sql`UPDATE social_personas SET etiquetas = ${JSON.stringify(e)} WHERE igsid = ${igsid}`;
  }
  if (typeof b.pausado === "boolean") {
    await sql`UPDATE social_personas SET paso = ${b.pausado ? "revision" : "esperando_texto"}, actualizado = NOW() WHERE igsid = ${igsid}`;
  }
  return NextResponse.json({ ok: true });
}
