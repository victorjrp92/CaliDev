import { NextResponse, after } from "next/server";
import { borrarCita, crearCita, registrarEvento, reservar } from "@/lib/citas/datos";
import { describir } from "@/lib/citas/horarios";
import { horariosAgendaPublica } from "@/lib/citas/libres";
import { enlaceGoogleCalendar } from "@/lib/citas/ics";
import { correoAvisoCita, correoConfirmacionCita } from "@/lib/citas/correo-reserva";
import { reprogramarAvisos } from "@/lib/citas/avisos";
import { sincronizarCalendario } from "@/lib/citas/calendario";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Reserva desde la agenda pública (calidev.dev/agendar), sin invitación previa:
 * la persona deja nombre, correo y WhatsApp y elige una hora libre. Se crea la
 * cita ya reservada y salen los mismos correos que con una invitación:
 * confirmación con el .ics, aviso a Víctor y recordatorios de 24 h y 1 h.
 *
 * Solo valen las horas de la agenda pública; si otra persona tomó la misma un
 * segundo antes, el índice único de la base lo impide y se le pide otra.
 */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (txt(body.sitio, 50)) return NextResponse.json({ ok: true }); // campo trampa para bots
  const nombre = txt(body.nombre, 100);
  const correo = txt(body.correo, 200).toLowerCase();
  const whatsapp = txt(body.whatsapp, 30);
  const negocio = txt(body.negocio, 120);
  const codigo = txt(body.codigo, 40);
  const horario = horariosAgendaPublica().find((h) => h.id === body.horario);

  if (nombre.length < 2) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  if (!CORREO.test(correo)) return NextResponse.json({ error: "Revisa tu correo: ahí te llega el enlace de la videollamada." }, { status: 400 });
  if (!horario) return NextResponse.json({ error: "Ese horario ya no está disponible. Elige otro." }, { status: 400 });

  try {
    const cita = await crearCita(nombre, correo, [horario.id], { tipo: "primera" });
    const r = await reservar(cita, horario.inicio);
    if (!r.ok) {
      await borrarCita(cita.id);
      return NextResponse.json({ error: "Otra persona acaba de tomar ese horario. Elige otro.", ocupado: true }, { status: 409 });
    }
    const guardada = r.cita;
    after(async () => {
      const detalle = [`Agenda pública: ${describir(horario)}`, whatsapp && `WhatsApp ${whatsapp}`, negocio && `Negocio: ${negocio}`, codigo && `Instagram (código ${codigo})`]
        .filter(Boolean)
        .join(" · ");
      await registrarEvento(guardada.id, "reserva", detalle);
      const ok = await enviarCorreo(correoConfirmacionCita(guardada, horario, false));
      await registrarEvento(guardada.id, ok ? "confirmacion" : "fallo", ok ? "Confirmación con invitación de calendario" : "La confirmación no salió");
      await enviarCorreo(correoAvisoCita(guardada, horario, false));
      await reprogramarAvisos(cita, guardada);
      await sincronizarCalendario(guardada);
    });
    return NextResponse.json({ ok: true, descripcion: describir(horario), google: enlaceGoogleCalendar(guardada, horario) });
  } catch (err) {
    console.error("agenda pública:", err);
    return NextResponse.json({ error: "No pudimos guardar tu cita. Inténtalo de nuevo." }, { status: 500 });
  }
}
