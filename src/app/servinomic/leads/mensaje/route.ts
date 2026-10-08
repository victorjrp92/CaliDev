import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { citaPorId, registrarEvento } from "@/lib/citas/datos";
import { enviarCorreo, envolver, escapar } from "@/lib/delegar/correos/enviar";

/**
 * Un mensaje corto y libre a la persona de una cita (por ejemplo, «te estoy
 * esperando en el enlace»). Sale de info@calidev.dev con respuesta a Víctor y
 * queda en el historial de la ficha. Bajo /servinomic por la cookie del panel.
 */
export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const cita = await citaPorId(Number(body.id));
  if (!cita) return NextResponse.json({ error: "No existe esa cita." }, { status: 404 });
  const asunto = typeof body.asunto === "string" ? body.asunto.trim().slice(0, 150) : "";
  const texto = typeof body.texto === "string" ? body.texto.trim().slice(0, 2000) : "";
  if (!asunto || !texto) return NextResponse.json({ error: "Faltan asunto o texto." }, { status: 400 });

  const html = envolver(
    texto
      .split(/\n{2,}/)
      .map((p) => `<p>${escapar(p).replace(/\n/g, "<br>").replace(/(https:\/\/meet\.google\.com\/[a-z-]+)/g, '<a href="$1" style="color:#0A3D2E;font-weight:700">$1</a>')}</p>`)
      .join("")
  );
  const ok = await enviarCorreo({ para: cita.correo, asunto, texto, html });
  await registrarEvento(cita.id, ok ? "mensaje" : "fallo", ok ? `Mensaje: «${asunto}»` : "El mensaje no salió");
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
}
