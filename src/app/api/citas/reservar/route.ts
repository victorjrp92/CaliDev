import { NextResponse, after } from "next/server";
import { citaPorToken, registrarEvento, reservar } from "@/lib/citas/datos";
import { describir, disponibleAun, horarioDeCita, horariosDeCita } from "@/lib/citas/horarios";
import { enlaceGoogleCalendar } from "@/lib/citas/ics";
import { correoAvisoCita, correoConfirmacionCita } from "@/lib/citas/correo-reserva";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";
import { reprogramarAvisos } from "@/lib/citas/avisos";

/**
 * Reserva (o cambio) de la hora de una videollamada.
 *
 * Solo por POST y desde el botón «Confirmar» de la página: el enlace del correo
 * nunca reserva, para que los filtros de correo que abren enlaces no lo hagan
 * por la persona.
 *
 * Quien choca con otra persona en la misma hora recibe `ocupado` y elige otra;
 * lo decide el índice único de la base, no una comprobación previa.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token : "";
    const pedido = typeof body.horario === "string" ? body.horario : "";

    const cita = await citaPorToken(token);
    if (!cita) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
    // Solo vale una hora de las que se le ofrecieron a esta persona.
    const horario = horariosDeCita(cita).find((h) => h.id === pedido);
    if (!horario || !disponibleAun(horario)) {
      return NextResponse.json({ error: "Ese horario ya no está disponible. Elige otro." }, { status: 400 });
    }

    // Misma hora que ya tenía: nada que cambiar ni que reenviar.
    if (horarioDeCita(cita)?.id === horario.id) {
      return NextResponse.json({ ok: true, descripcion: describir(horario), google: enlaceGoogleCalendar(cita, horario) });
    }

    const resultado = await reservar(cita, horario.inicio);
    if (!resultado.ok) {
      return NextResponse.json(
        { error: "Otra persona acaba de tomar ese horario. Elige otro.", ocupado: true },
        { status: 409 }
      );
    }

    const { cita: guardada, cambio } = resultado;
    after(async () => {
      await registrarEvento(guardada.id, cambio ? "cambio" : "reserva", describir(horario));
      const confirmo = await enviarCorreo(correoConfirmacionCita(guardada, horario, cambio));
      await registrarEvento(guardada.id, confirmo ? "confirmacion" : "fallo", confirmo ? "Confirmación con invitación de calendario" : "La confirmación no salió");
      await enviarCorreo(correoAvisoCita(guardada, horario, cambio));
      // Recordatorios de 24 horas y 1 hora antes; si cambió de hora, se
      // cancelan los de la hora anterior (sus ids venían en `cita`).
      await reprogramarAvisos(cita, guardada);
    });

    return NextResponse.json({
      ok: true,
      descripcion: describir(horario),
      google: enlaceGoogleCalendar(guardada, horario),
    });
  } catch (err) {
    console.error("citas reservar:", err);
    return NextResponse.json({ error: "No pudimos guardar tu reserva. Inténtalo de nuevo." }, { status: 500 });
  }
}
