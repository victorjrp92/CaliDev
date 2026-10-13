import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { agregarHorario, citaPorId, crearCita, registrarEvento, reservar, type Cita } from "@/lib/citas/datos";
import { describir, disponibleAun, duracionDe, horarioDesdeId } from "@/lib/citas/horarios";
import { correoAvisoCita, correoConfirmacionCita } from "@/lib/citas/correo-reserva";
import { reprogramarAvisos } from "@/lib/citas/avisos";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Agendar directamente: Víctor fija la hora de una cita que ya acordó por
 * WhatsApp o en la llamada, sin que la persona tenga que elegirla. Le llega la
 * confirmación (con el mensaje de Víctor arriba y la invitación de calendario),
 * a Víctor su aviso, y se programan los recordatorios de 24 h y 1 h antes.
 *
 * Bajo /servinomic por la cookie del panel. Se espera a los correos para poder
 * decir en el panel si salieron.
 */
export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  const tipo = body.tipo === "segunda" ? "segunda" : "primera";
  const horarioId = typeof body.horario === "string" ? body.horario : "";

  // Con `id`, se agenda una cita existente. Sin él, con nombre y correo, se crea
  // la cita y se agenda en el mismo paso: la persona recibe solo la confirmación,
  // no una invitación para elegir hora que ya eligió por otro lado.
  let cita: Cita | null = null;
  if (Number.isInteger(id) && id > 0) {
    cita = await citaPorId(id);
  } else {
    const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 120) : "";
    const correo = typeof body.correo === "string" ? body.correo.trim().toLowerCase().slice(0, 160) : "";
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      return NextResponse.json({ error: "Faltan el nombre o un correo válido." }, { status: 400 });
    }
    if (!horarioDesdeId(horarioId)) return NextResponse.json({ error: "Esa hora no es válida." }, { status: 400 });
    cita = await crearCita(nombre, correo, [horarioId], { tipo });
  }
  if (!cita) return NextResponse.json({ error: "No existe esa cita." }, { status: 404 });

  const horario = horarioDesdeId(horarioId, duracionDe(cita));
  if (!horario || !disponibleAun(horario)) {
    return NextResponse.json({ error: "Esa hora no es válida o ya pasó." }, { status: 400 });
  }
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 800) || null : null;

  await agregarHorario(cita.id, horario.id);
  const resultado = await reservar(cita, horario.inicio);
  if (!resultado.ok) return NextResponse.json({ error: "Esa hora ya la tiene otra persona." }, { status: 409 });

  const { cita: guardada, cambio } = resultado;
  await registrarEvento(guardada.id, cambio ? "cambio" : "reserva", `Agendada por Víctor: ${describir(horario)}`);
  const confirmo = await enviarCorreo(correoConfirmacionCita(guardada, horario, cambio, mensaje));
  await registrarEvento(
    guardada.id,
    confirmo ? "confirmacion" : "fallo",
    confirmo ? `Confirmación con invitación de calendario${mensaje ? ` · «${mensaje.slice(0, 120)}»` : ""}` : "La confirmación no salió"
  );
  await enviarCorreo(correoAvisoCita(guardada, horario, cambio));
  await reprogramarAvisos(cita, guardada);

  return NextResponse.json({ ok: confirmo, mensaje: confirmo ? "Agendada y confirmación enviada." : "Agendada, pero la confirmación no salió." });
}
