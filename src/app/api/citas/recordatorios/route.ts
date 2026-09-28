import { NextResponse } from "next/server";
import { citasParaRecordar } from "@/lib/citas/datos";
import { enviarRecordatorio } from "@/lib/citas/recordar";

/**
 * Tarea programada de Vercel (vercel.json → crons), cada hora: recordatorio a
 * quien lleva 24 horas sin elegir hora. Uno por invitación.
 *
 * Vercel la llama con `Authorization: Bearer <CRON_SECRET>`; sin esa clave no
 * hace nada, así nadie de fuera puede disparar correos.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pendientes = await citasParaRecordar();
  const resultados: Record<string, number> = {};
  for (const cita of pendientes) {
    const r = await enviarRecordatorio(cita);
    resultados[r] = (resultados[r] ?? 0) + 1;
  }
  return NextResponse.json({ revisadas: pendientes.length, ...resultados });
}
