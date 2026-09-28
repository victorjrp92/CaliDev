import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { borrarCita } from "@/lib/citas/datos";

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
  const ok = await borrarCita(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No existe" }, { status: 404 });
}
