import { NextResponse } from "next/server";
import { medirPublicaciones } from "@/lib/social/metricas";
import { relojAutorizado } from "@/lib/social/reloj";
import { panelAbierto } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Lo llama el reloj externo cada hora; también se puede lanzar desde el panel. */
export async function POST(peticion: Request) {
  if (!relojAutorizado(peticion) && !(await panelAbierto())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await medirPublicaciones());
}
