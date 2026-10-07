import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { ETAPAS_MANUALES, guardarEtapa, guardarNota, type EtapaManual } from "@/lib/seguimiento/datos";

/**
 * Lo que Víctor marca a mano en una ficha: la etapa (propuesta enviada, ganado,
 * perdido, en pausa, o quitarla) y su nota. Bajo /servinomic por la cookie del
 * panel.
 */
export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const clave = typeof body.clave === "string" ? body.clave.trim().slice(0, 200) : "";
  if (!clave) return NextResponse.json({ error: "Falta la persona." }, { status: 400 });

  if ("etapa" in body) {
    const etapa = body.etapa === null ? null : (body.etapa as EtapaManual);
    if (etapa !== null && !ETAPAS_MANUALES.includes(etapa)) {
      return NextResponse.json({ error: "Etapa no válida." }, { status: 400 });
    }
    await guardarEtapa(clave, etapa);
  }
  if ("nota" in body) {
    const nota = typeof body.nota === "string" ? body.nota.trim().slice(0, 2000) || null : null;
    await guardarNota(clave, nota);
  }
  return NextResponse.json({ ok: true });
}
