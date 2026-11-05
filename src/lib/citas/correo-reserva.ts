import { escapar, CORREO_VICTOR, type Correo } from "@/lib/delegar/correos/enviar";
import { ENLACE_VIDEOLLAMADA, describir, horaEnFrankfurt, textoDuracion, tipoDe, type Horario } from "@/lib/citas/horarios";
import { enlaceGoogleCalendar, ics } from "@/lib/citas/ics";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, boton, etiqueta, firma, marco } from "@/lib/citas/estilo-correo";
import { NOMBRE_PROGRAMA, esSesion, nombreSaludo, rotuloSesion } from "@/lib/citas/sesion";

/**
 * Los dos correos que salen al reservar: la confirmación para la persona, con
 * la invitación de calendario adjunta, y el aviso para Víctor con el mismo
 * evento para su calendario.
 */

const SITIO = "https://calidev.dev";

/**
 * `mensaje`: cuando Víctor agenda la hora a mano (acordada por WhatsApp o en la
 * llamada), su nota va arriba del correo, antes de los datos de la cita.
 */
export function correoConfirmacionCita(cita: Cita, h: Horario, cambio: boolean, mensaje?: string | null): Correo {
  const nombre = nombreSaludo(cita);
  const cuando = describir(h);
  const sesion = esSesion(cita);
  const rotulo = rotuloSesion(cita);
  const cambiar = `${SITIO}/cita/${cita.token}`;
  const nota = mensaje?.trim()
    ? `<tr><td style="padding:24px 24px 0;font-family:${FUENTE};font-size:15.5px;line-height:1.6;color:${C.texto}">${escapar(mensaje.trim())}</td></tr>`
    : "";

  const cuerpo = `${nota}
    <tr><td style="padding:24px 24px 0;font-family:${FUENTE}">
      ${etiqueta(sesion ? `${NOMBRE_PROGRAMA} · ${rotulo}` : "Tu videollamada")}
      <div style="font-size:18px;font-weight:800;color:${C.tinta};line-height:1.35">${escapar(cuando)}</div>
      <div style="margin-top:6px;font-size:14px;color:${C.gris}">Por Google Meet · ${textoDuracion(cita)}${sesion ? " · incluida en tu contrato" : tipoDe(cita) === "segunda" ? " · presentación de tu propuesta" : " · gratuita"}</div>
    </td></tr>
    <tr><td style="padding:18px 24px 0">
      ${boton(sesion ? "Entrar a la sesión" : "Unirme a la videollamada", ENLACE_VIDEOLLAMADA)}
      <div style="height:10px"></div>
      ${boton("Agregar a Google Calendar", enlaceGoogleCalendar(cita, h), "verde")}
      <div style="margin-top:12px;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">También va adjunta la invitación (.ics) para Apple Calendar u Outlook.</div>
    </td></tr>
    <tr><td style="padding:22px 24px 26px;font-family:${FUENTE};font-size:14.5px;line-height:1.55;color:${C.texto}">
      ¿Necesitas otra hora? <a href="${cambiar}" style="color:${C.verde};font-weight:700">Cámbiala aquí</a> o responde este correo.
      ${firma()}
    </td></tr>`;

  const html = marco({
    titulo: sesion ? "Sesión confirmada" : "Videollamada confirmada",
    vistaPrevia: escapar(`${cuando}. Te espero en Google Meet.`),
    meta: sesion ? `${escapar(rotulo)} · ${cambio ? "hora cambiada" : "confirmada"}` : cambio ? "Videollamada · hora cambiada" : "Videollamada confirmada",
    encabezado: `Listo, ${escapar(nombre)}. Nos vemos.`,
    cuerpo,
    pie: sesion ? "Recibes este correo porque eres cliente de CaliDev." : "Recibes este correo porque reservaste una videollamada con CaliDev.",
  });

  const texto = [
    `Listo, ${nombre}. Nos vemos.`,
    "",
    ...(mensaje?.trim() ? [mensaje.trim(), ""] : []),
    sesion
      ? `${NOMBRE_PROGRAMA}, ${rotulo}: ${cuando}. Por Google Meet, ${textoDuracion(cita)}, incluida en tu contrato.`
      : `Tu videollamada: ${cuando}. Por Google Meet, ${textoDuracion(cita)}${tipoDe(cita) === "segunda" ? ", para presentarte la propuesta" : ", gratuita"}.`,
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
    asunto: `${sesion ? rotulo : "Videollamada"} ${cambio ? "cambiada" : "confirmada"}: ${cuando}`,
    texto,
    html,
    adjuntos: [{ nombre: sesion ? "sesion-calidev.ics" : "videollamada-calidev.ics", contenido: ics(cita, h, "REQUEST"), tipo: "text/calendar; method=REQUEST" }],
  };
}

export function correoAvisoCita(cita: Cita, h: Horario, cambio: boolean): Correo {
  const cuando = describir(h);
  const que = esSesion(cita) ? `${rotuloSesion(cita)} de ${NOMBRE_PROGRAMA}` : "videollamada";
  const accion = cambio ? `cambió su ${que} a` : `reservó su ${que}:`;
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
