import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { crearCita } from "@/lib/citas/datos";
import { DIAS_ADELANTE, disponibleAun, horarioDesdeId } from "@/lib/citas/horarios";
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

    // Los horarios que Víctor marcó: válidos, futuros, dentro de la ventana y sin repetir.
    const limite = Date.now() + (DIAS_ADELANTE + 1) * 24 * 60 * 60 * 1000;
    const pedidos = Array.isArray(body.horarios) ? body.horarios.filter((x): x is string => typeof x === "string") : [];
    const horarios = [...new Set(pedidos)]
      .map((id) => horarioDesdeId(id))
      .filter((h) => h && disponibleAun(h) && h.inicio.getTime() < limite)
      .map((h) => h!.id)
      .sort()
      .slice(0, 40);
    if (horarios.length === 0) {
      return NextResponse.json({ error: "Marca al menos un horario para ofrecerle." }, { status: 400 });
    }

    // Segunda cita = presentación de la propuesta (30 min). El mensaje, si lo
    // hay, encabeza el correo; se guarda como texto y se escapa al enviarlo.
    const tipo = body.tipo === "segunda" ? "segunda" : "primera";
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 600) || null : null;

    const cita = await crearCita(nombre, correo, horarios, { tipo, mensaje });
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
