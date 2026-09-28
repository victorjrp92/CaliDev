import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { enviarRecordatorioPorId } from "@/lib/citas/recordar";

/** Enviar el recordatorio a mano desde el panel. Bajo /servinomic por la cookie del panel. */
const MENSAJE = {
  enviado: "Recordatorio enviado.",
  "sin-horarios": "No queda ningún horario libre de los que le ofreciste. Invítala de nuevo con horarios nuevos.",
  fallo: "El correo no salió. Revisa Resend.",
  "ya-agendo": "Ya eligió su hora.",
} as const;

export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const r = await enviarRecordatorioPorId(id);
  if (!r) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: r === "enviado", mensaje: MENSAJE[r] }, { status: r === "enviado" ? 200 : 409 });
}
