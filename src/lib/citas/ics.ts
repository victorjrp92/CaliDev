import { ENLACE_VIDEOLLAMADA, type Horario } from "@/lib/citas/horarios";
import type { Cita } from "@/lib/citas/datos";

/**
 * Invitación de calendario (.ics) y enlace de «Agregar a Google Calendar».
 *
 * Es lo que pone la cita en los dos calendarios sin conectar el sitio a
 * Google: Gmail y el iPhone reconocen el adjunto y lo agregan con un toque.
 *
 * Dos métodos:
 *  · REQUEST para la persona invitada: Gmail le enseña la tarjeta con Sí / No,
 *    y su respuesta le llega a Víctor, que es el organizador.
 *  · PUBLISH para Víctor: siendo él el organizador, una REQUEST le llegaría
 *    como «ya estás invitado»; PUBLISH simplemente agrega el evento.
 *
 * UID fijo por cita y SEQUENCE creciente: si la persona cambia de hora, el
 * calendario mueve el evento en vez de crear otro.
 */

const ORGANIZADOR = "calidevdev@gmail.com";
const TITULO = "Videollamada con Víctor (CaliDev)";

function fechaIcs(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escaparIcs(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** RFC 5545: ninguna línea pasa de 75 octetos; las largas siguen con un espacio. */
function plegar(linea: string): string {
  const bytes = Buffer.from(linea, "utf8");
  if (bytes.length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  for (const ch of linea) {
    if (Buffer.byteLength(actual + ch, "utf8") > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = "";
    }
    actual += ch;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

function descripcion(): string {
  return `Enlace de la videollamada: ${ENLACE_VIDEOLLAMADA}\n\nConversamos sobre tu negocio y sus procesos. Después te envío una propuesta de trabajo.`;
}

export function ics(cita: Cita, h: Horario, metodo: "REQUEST" | "PUBLISH"): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CaliDev//Citas//ES",
    "CALSCALE:GREGORIAN",
    `METHOD:${metodo}`,
    "BEGIN:VEVENT",
    `UID:cita-${cita.id}@calidev.dev`,
    `SEQUENCE:${cita.secuencia}`,
    `DTSTAMP:${fechaIcs(new Date())}`,
    `DTSTART:${fechaIcs(h.inicio)}`,
    `DTEND:${fechaIcs(h.fin)}`,
    `SUMMARY:${escaparIcs(`${TITULO} · ${cita.nombre}`)}`,
    `DESCRIPTION:${escaparIcs(descripcion())}`,
    `LOCATION:${escaparIcs(ENLACE_VIDEOLLAMADA)}`,
    `URL:${ENLACE_VIDEOLLAMADA}`,
    `ORGANIZER;CN=${escaparIcs("Víctor (CaliDev)")}:mailto:${ORGANIZADOR}`,
    `ATTENDEE;CN=${escaparIcs(cita.nombre)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${cita.correo}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Videollamada con CaliDev en 30 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

/** Enlace que abre Google Calendar con el evento ya lleno. */
export function enlaceGoogleCalendar(cita: Cita, h: Horario): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${TITULO} · ${cita.nombre}`,
    dates: `${fechaIcs(h.inicio)}/${fechaIcs(h.fin)}`,
    details: descripcion(),
    location: ENLACE_VIDEOLLAMADA,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
