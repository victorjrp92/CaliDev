import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { crearCita } from "@/lib/citas/datos";
import { correoInvitacion } from "@/lib/citas/correo-invitacion";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Invitar a alguien a elegir hora para la videollamada, desde el panel.
 *
 * Vive bajo /servinomic para que le llegue la cookie del panel (su `path` es
 * /servinomic): sin panel abierto, no invita. A diferencia de los avisos, aquí
 * el correo se espera: el panel tiene que decir si salió o no.
 */
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 120) : "";
    const correo = typeof body.correo === "string" ? body.correo.trim().toLowerCase().slice(0, 160) : "";
    if (nombre.length < 2) return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
    if (!CORREO_OK.test(correo)) return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });

    const cita = await crearCita(nombre, correo);
    const enviado = await enviarCorreo(correoInvitacion(cita));
    if (!enviado) {
      return NextResponse.json(
        { error: "La invitación se guardó, pero el correo no salió. Revisa Resend.", enlace: `/cita/${cita.token}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, enlace: `/cita/${cita.token}` });
  } catch (err) {
    console.error("citas invitar:", err);
    return NextResponse.json({ error: "No pudimos crear la invitación." }, { status: 500 });
  }
}
