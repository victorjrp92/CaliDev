import { escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre } from "@/lib/delegar/correos/lead";
import { HORARIOS, disponibleAun, horaDe, porDia } from "@/lib/citas/horarios";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, etiqueta, firma, marco } from "@/lib/citas/estilo-correo";

/**
 * Invitación a elegir horario para la videollamada.
 *
 * Cada botón lleva a calidev.dev/cita/<token>?h=<horario>, donde se CONFIRMA
 * con otro botón. Tocar el enlace no reserva: los filtros de correo abren los
 * enlaces para revisarlos, y si reservaran solos, reservarían por la persona.
 *
 * Explica el proceso completo en tres pasos —llamada gratuita, propuesta de
 * trabajo, propuesta formal con presupuesto— para que nadie llegue a la
 * llamada esperando un precio.
 */

const SITIO = "https://calidev.dev";

export function correoInvitacion(cita: Cita): Correo {
  const nombre = primerNombre(cita.nombre);
  const enlace = (id: string) => `${SITIO}/cita/${cita.token}?h=${encodeURIComponent(id)}`;
  const grupos = porDia(HORARIOS.filter((h) => disponibleAun(h)));

  const pasos = [
    ["Videollamada gratuita de 1 hora", "Me cuentas cómo funciona tu negocio y sus procesos."],
    ["Propuesta de trabajo", "Te envío las opciones que veo para tu caso."],
    ["Propuesta formal con presupuesto", "Cuando elijas la opción que te sirva."],
  ];

  const filasPasos = pasos
    .map(
      ([t, d], i) => `
      <tr>
        <td width="30" valign="top" style="padding:0 0 12px">
          <div style="width:24px;height:24px;line-height:24px;border-radius:50%;text-align:center;font-size:12px;font-weight:800;font-family:${FUENTE};${
            i === 0 ? `background:${C.verde};color:${C.lima}` : `background:#ffffff;color:${C.gris};border:2px solid ${C.linea};line-height:20px;width:20px;height:20px`
          }">${i + 1}</div>
        </td>
        <td valign="top" style="padding:2px 0 12px 10px;font-family:${FUENTE}">
          <div style="font-size:15px;font-weight:700;color:${C.tinta}">${t}</div>
          <div style="font-size:13.5px;color:${C.gris};line-height:1.45">${d}</div>
        </td>
      </tr>`
    )
    .join("");

  const bloquesHorarios = grupos
    .map(
      (g) => `
      <div style="font-family:${FUENTE};font-size:14px;font-weight:700;color:${C.tinta};margin:14px 0 8px">${g.dia}</div>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        ${g.horarios
          .map(
            (h) =>
              `<td style="padding:0 8px 0 0"><a href="${enlace(h.id)}" style="display:inline-block;background:${C.lima};color:${C.tinta};font-family:${FUENTE};font-weight:700;font-size:14px;padding:10px 12px;border-radius:10px;text-decoration:none;white-space:nowrap">${horaDe(h.inicio)}</a></td>`
          )
          .join("")}
      </tr></table>`
    )
    .join("");

  const cuerpo = `
    <tr><td style="padding:24px 24px 4px;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.texto}">
      Gracias por escribirme por Instagram. Me gustaría conocer tu negocio y cómo trabajan hoy, así que te propongo una videollamada. Así es el proceso:
    </td></tr>
    <tr><td style="padding:16px 24px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filasPasos}</table>
    </td></tr>
    <tr><td style="padding:12px 24px 0">
      ${etiqueta("Elige tu horario · hora de Colombia")}
      ${bloquesHorarios}
      <div style="margin-top:14px;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">Toca la hora que te quede mejor y confírmala en la página. Te llega la invitación a tu calendario con el enlace de la videollamada.</div>
    </td></tr>
    <tr><td style="padding:22px 24px 26px;font-family:${FUENTE};font-size:14.5px;line-height:1.55;color:${C.texto}">
      Si ninguno de estos horarios te sirve, responde este correo y buscamos otro.
      ${firma()}
    </td></tr>`;

  const html = marco({
    titulo: "Elige el horario de tu videollamada",
    vistaPrevia: escapar(`Videollamada gratuita de 1 hora para conocer tu negocio. Elige el horario que te quede mejor.`),
    meta: "Videollamada gratuita · 1 hora",
    encabezado: `${escapar(nombre)}, elige tu horario.`,
    cuerpo,
    pie: "Recibes este correo porque le escribiste a CaliDev por Instagram.",
  });

  const texto = [
    `Hola ${nombre}:`,
    "",
    "Gracias por escribirme por Instagram. Me gustaría conocer tu negocio y cómo trabajan hoy, así que te propongo una videollamada gratuita de 1 hora.",
    "",
    "Así es el proceso:",
    "1. Videollamada gratuita de 1 hora: me cuentas cómo funciona tu negocio y sus procesos.",
    "2. Propuesta de trabajo: te envío las opciones que veo para tu caso.",
    "3. Propuesta formal con presupuesto: cuando elijas la opción que te sirva.",
    "",
    "Elige tu horario (hora de Colombia):",
    ...grupos.flatMap((g) => [g.dia, ...g.horarios.map((h) => `  ${horaDe(h.inicio)}: ${enlace(h.id)}`)]),
    "",
    "Si ninguno te sirve, responde este correo y buscamos otro.",
    "",
    "Víctor",
    "CaliDev · calidev.dev",
  ].join("\n");

  return { para: cita.correo, asunto: `${nombre}, elige el horario de nuestra videollamada`, texto, html };
}
