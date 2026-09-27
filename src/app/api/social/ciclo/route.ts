import { NextResponse } from "next/server";
import { correrCiclo } from "@/lib/social/ciclo";
import { relojAutorizado } from "@/lib/social/reloj";

/**
 * Lo llama cron-job.org cada minuto (Vercel Cron en el plan Hobby solo corre
 * una vez al día). Cada ejecución hace pocas acciones y termina.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(peticion: Request) {
  if (!relojAutorizado(peticion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await correrCiclo());
}
