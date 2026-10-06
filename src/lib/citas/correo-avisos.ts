import { escapar, CORREO_VICTOR, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre } from "@/lib/delegar/correos/lead";
import { ENLACE_VIDEOLLAMADA, describir, horaEnFrankfurt, textoDuracion, tipoDe, type Horario } from "@/lib/citas/horarios";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, boton, etiqueta, firma, marco } from "@/lib/citas/estilo-correo";

/**
 * Los recordatorios antes de la cita: 24 horas y 1 hora antes, para la persona
 * y para Víctor. Se programan en Resend al reservar (ver lib/citas/avisos.ts).
 *
 * Cortos a propósito: cuándo es y cómo entrar. El de 24 horas le deja además a
 * la persona el enlace para cambiar la hora, porque es el momento en que todavía
 * puede hacerlo sin dejar a nadie esperando.
 */

const SITIO = "https://calidev.dev";
export type Antelacion = "24h" | "1h";

export function avisoParaElla(cita: Cita, h: Horario, antes: Antelacion): Correo {
  const nombre = primerNombre(cita.nombre);
  const cuando = describir(h);
  const titulo = antes === "24h" ? `${nombre}, nos vemos mañana.` : `${nombre}, nos vemos en una hora.`;
  const cambiar =
    antes === "24h"
      ? `<div style="margin-top:14px;font-family:${FUENTE};font-size:14px;color:${C.gris}">¿Necesitas otra hora? <a href="${SITIO}/cita/${cita.token}" style="color:${C.verde};font-weight:700">Cámbiala aquí</a>.</div>`
      : "";

  const cuerpo = `
    <tr><td style="padding:24px 24px 0;font-family:${FUENTE}">
      ${etiqueta("Tu videollamada")}
      <div style="font-size:18px;font-weight:800;color:${C.tinta};line-height:1.35">${escapar(cuando)}</div>
      <div style="margin-top:6px;font-size:14px;color:${C.gris}">Por Google Meet · ${textoDuracion(cita)}${tipoDe(cita) === "segunda" ? " · presentación de tu propuesta" : ""}</div>
    </td></tr>
    <tr><td style="padding:18px 24px 26px;font-family:${FUENTE};font-size:14.5px;color:${C.texto}">
      ${boton("Unirme a la videollamada", ENLACE_VIDEOLLAMADA)}
      ${cambiar}
      ${firma()}
    </td></tr>`;

  return {
    para: cita.correo,
    asunto: antes === "24h" ? `Mañana: tu videollamada con Víctor (CaliDev)` : `En 1 hora: tu videollamada con Víctor (CaliDev)`,
    texto: [titulo, "", cuando, `Enlace: ${ENLACE_VIDEOLLAMADA}`, antes === "24h" ? `Cambiar la hora: ${SITIO}/cita/${cita.token}` : "", "", "Víctor", "CaliDev · calidev.dev"]
      .filter((l, i, a) => l !== "" || a[i - 1] !== "")
      .join("\n"),
    html: marco({
      titulo: "Recordatorio de tu videollamada",
      vistaPrevia: escapar(`${cuando}. Te espero en Google Meet.`),
      meta: antes === "24h" ? "Recordatorio · mañana" : "Recordatorio · en 1 hora",
      encabezado: escapar(titulo),
      cuerpo,
      pie: "Recibes este correo porque reservaste una videollamada con CaliDev.",
    }),
  };
}

export function avisoParaVictor(cita: Cita, h: Horario, antes: Antelacion): Correo {
  const frankfurt = horaEnFrankfurt(h);
  const cuerpo = `
    <tr><td style="padding:24px 24px 0;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.texto}">
      <strong>${escapar(cita.nombre)}</strong> · ${escapar(cita.correo)}
      <div style="margin-top:8px;font-size:17px;font-weight:800;color:${C.tinta}">${escapar(frankfurt)}</div>
      <div style="color:${C.gris}">${escapar(describir(h))}</div>
    </td></tr>
    <tr><td style="padding:18px 24px 26px">
      ${boton("Abrir Google Meet", ENLACE_VIDEOLLAMADA)}
    </td></tr>`;

  return {
    para: CORREO_VICTOR,
    asunto: `${antes === "24h" ? "Mañana" : "En 1 hora"} · ${tipoDe(cita) === "segunda" ? "propuesta" : "videollamada"} con ${cita.nombre} · ${frankfurt}`,
    texto: `${antes === "24h" ? "Mañana" : "En 1 hora"}: videollamada con ${cita.nombre} (${cita.correo}), ${frankfurt}.\n${describir(h)}\n${ENLACE_VIDEOLLAMADA}`,
    html: marco({
      titulo: "Recordatorio de videollamada",
      vistaPrevia: escapar(`${cita.nombre}: ${frankfurt}`),
      meta: antes === "24h" ? "Mañana" : "En 1 hora",
      encabezado: escapar(`Videollamada con ${primerNombre(cita.nombre)}`),
      cuerpo,
      pie: "Aviso interno de calidev.dev.",
    }),
  };
}
