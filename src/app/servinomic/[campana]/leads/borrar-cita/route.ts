import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { borrarCita, citaPorId } from "@/lib/citas/datos";
import { cancelarAvisos } from "@/lib/citas/avisos";

/**
 * Borra una invitación desde el panel y libera su hora: para pruebas y para
 * cuando alguien cancela. Bajo /servinomic por la cookie del panel.
 */
export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  // Primero se cancelan los recordatorios programados: si no, llegarían avisos
  // de una cita que ya no existe.
  const cita = await citaPorId(id);
  if (cita) await cancelarAvisos(cita);
  const ok = await borrarCita(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No existe" }, { status: 404 });
}
