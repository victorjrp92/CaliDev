import { escapar, CORREO_VICTOR, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre } from "@/lib/delegar/correos/lead";
import { ENLACE_VIDEOLLAMADA, describir, horaEnFrankfurt, type Horario } from "@/lib/citas/horarios";
import { enlaceGoogleCalendar, ics } from "@/lib/citas/ics";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, boton, etiqueta, firma, marco } from "@/lib/citas/estilo-correo";

/**
 * Los dos correos que salen al reservar: la confirmación para la persona, con
 * la invitación de calendario adjunta, y el aviso para Víctor con el mismo
 * evento para su calendario.
 */

const SITIO = "https://calidev.dev";

export function correoConfirmacionCita(cita: Cita, h: Horario, cambio: boolean): Correo {
  const nombre = primerNombre(cita.nombre);
  const cuando = describir(h);
  const cambiar = `${SITIO}/cita/${cita.token}`;

  const cuerpo = `
    <tr><td style="padding:24px 24px 0;font-family:${FUENTE}">
      ${etiqueta("Tu videollamada")}
      <div style="font-size:18px;font-weight:800;color:${C.tinta};line-height:1.35">${escapar(cuando)}</div>
      <div style="margin-top:6px;font-size:14px;color:${C.gris}">Por Google Meet · 1 hora · gratuita</div>
    </td></tr>
    <tr><td style="padding:18px 24px 0">
      ${boton("Unirme a la videollamada", ENLACE_VIDEOLLAMADA)}
      <div style="height:10px"></div>
      ${boton("Agregar a Google Calendar", enlaceGoogleCalendar(cita, h), "verde")}
      <div style="margin-top:12px;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">También va adjunta la invitación (.ics) para Apple Calendar u Outlook.</div>
    </td></tr>
    <tr><td style="padding:22px 24px 26px;font-family:${FUENTE};font-size:14.5px;line-height:1.55;color:${C.texto}">
      ¿Necesitas otra hora? <a href="${cambiar}" style="color:${C.verde};font-weight:700">Cámbiala aquí</a> o responde este correo.
      ${firma()}
    </td></tr>`;

  const html = marco({
    titulo: "Videollamada confirmada",
    vistaPrevia: escapar(`${cuando}. Te espero en Google Meet.`),
    meta: cambio ? "Videollamada · hora cambiada" : "Videollamada confirmada",
    encabezado: `Listo, ${escapar(nombre)}. Nos vemos.`,
    cuerpo,
    pie: "Recibes este correo porque reservaste una videollamada con CaliDev.",
  });

  const texto = [
    `Listo, ${nombre}. Nos vemos.`,
    "",
    `Tu videollamada: ${cuando}. Por Google Meet, 1 hora, gratuita.`,
    `Enlace: ${ENLACE_VIDEOLLAMADA}`,
    `Agregar a Google Calendar: ${enlaceGoogleCalendar(cita, h)}`,
    "",
    `¿Necesitas otra hora? Cámbiala aquí: ${cambiar}`,
    "",
    "Víctor",
    "CaliDev · calidev.dev",
  ].join("\n");

  return {
    para: cita.correo,
    asunto: cambio ? `Videollamada cambiada: ${cuando}` : `Videollamada confirmada: ${cuando}`,
    texto,
    html,
    adjuntos: [{ nombre: "videollamada-calidev.ics", contenido: ics(cita, h, "REQUEST"), tipo: "text/calendar; method=REQUEST" }],
  };
}

export function correoAvisoCita(cita: Cita, h: Horario, cambio: boolean): Correo {
  const cuando = describir(h);
  const accion = cambio ? "cambió su videollamada a" : "reservó su videollamada:";
  const cuerpo = `
    <tr><td style="padding:24px 24px 0;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.texto}">
      <strong>${escapar(cita.nombre)}</strong> (${escapar(cita.correo)}) ${accion}
      <div style="margin-top:8px;font-size:17px;font-weight:800;color:${C.tinta}">${escapar(cuando)}</div>
      <div style="color:${C.gris}">${escapar(horaEnFrankfurt(h))}</div>
    </td></tr>
    <tr><td style="padding:18px 24px 26px">
      ${boton("Agregar a mi Google Calendar", enlaceGoogleCalendar(cita, h))}
      <div style="margin-top:12px;font-family:${FUENTE};font-size:13.5px;color:${C.gris}">La invitación también va adjunta. Enlace de Meet: ${ENLACE_VIDEOLLAMADA}</div>
    </td></tr>`;

  return {
    para: CORREO_VICTOR,
    asunto: `${cambio ? "Cita cambiada" : "Cita reservada"} · ${cita.nombre} · ${horaEnFrankfurt(h)}`,
    texto: `${cita.nombre} (${cita.correo}) ${accion} ${cuando} (${horaEnFrankfurt(h)}).\nAgregar: ${enlaceGoogleCalendar(cita, h)}`,
    html: marco({
      titulo: "Cita reservada",
      vistaPrevia: escapar(`${cita.nombre}: ${cuando}`),
      meta: cambio ? "Cita cambiada" : "Cita nueva",
      encabezado: escapar(cita.nombre),
      cuerpo,
      pie: "Aviso interno de calidev.dev.",
    }),
    adjuntos: [{ nombre: "videollamada.ics", contenido: ics(cita, h, "PUBLISH"), tipo: "text/calendar; method=PUBLISH" }],
  };
}
