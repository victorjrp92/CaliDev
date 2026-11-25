import { NextResponse } from "next/server";
import { proponerRecordatorios } from "@/lib/crm/agentes/cobros";
import { prepararDiagnosticos } from "@/lib/crm/agentes/preparacion";
import { asegurarEsquema } from "@/lib/crm/esquema";

/**
 * Tarea programada de Vercel (vercel.json → crons), una vez al día a las 7 a. m.
 * de Colombia (12:00 UTC): el agente de preparación escribe el brief de los
 * diagnósticos de las próximas 36 h y el de cobros propone recordatorios de
 * mora (que esperan en Aprobaciones; aquí no sale ningún correo).
 *
 * Vercel la llama con `Authorization: Bearer <CRON_SECRET>`. Un agente que
 * falla no impide que corra el otro; la respuesta dice qué pasó con cada uno.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function correr<T>(f: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await f();
  } catch (e) {
    console.error("CRM agentes:", e);
    return { error: (e as Error).message };
  }
}

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await asegurarEsquema();
  const preparacion = await correr(() => prepararDiagnosticos());
  const cobros = await correr(() => proponerRecordatorios());
  return NextResponse.json({ preparacion, cobros });
}
