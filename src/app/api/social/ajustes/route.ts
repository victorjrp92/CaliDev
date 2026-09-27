import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { datosAjustes } from "@/lib/social/consultas";
import { evento, fijarAjuste } from "@/lib/social/db";
import { sinSesion } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";

export async function GET() {
  const no = await sinSesion();
  if (no) return no;
  return NextResponse.json(await datosAjustes());
}

/**
 * Interruptores globales. `reprocesarSimulados` borra lo decidido en modo
 * simulación para que el agente, ya en modo real, responda esos comentarios de
 * verdad (si no, quedarían como "vistos" para siempre).
 */
export async function POST(peticion: Request) {
  const no = await sinSesion();
  if (no) return no;
  const b = await peticion.json().catch(() => ({}));
  if (typeof b.pausado === "boolean") {
    await fijarAjuste("pausado", b.pausado ? "1" : "0");
    await evento(b.pausado ? "Agente pausado desde el panel" : "Agente reanudado desde el panel");
  }
  if (typeof b.simulacion === "boolean") {
    await fijarAjuste("simulacion", b.simulacion ? "1" : "0");
    await evento(b.simulacion ? "Modo simulación activado" : "Modo real: el agente publica en Instagram", "alerta");
  }
  if (b.reprocesarSimulados === true) {
    const { rowCount } = await sql`DELETE FROM social_comentarios WHERE estado = 'simulado'`;
    await sql`UPDATE social_publicaciones SET comentarios_vistos = -1`;
    await evento(`${rowCount ?? 0} comentarios simulados vuelven a la cola`);
  }
  return NextResponse.json({ ok: true });
}
