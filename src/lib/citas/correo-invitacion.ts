import { escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre } from "@/lib/delegar/correos/lead";
import { ZONA_COLOMBIA, disponibleAun, horaCompacta, horariosDeCita, type Horario } from "@/lib/citas/horarios";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, MONO } from "@/lib/citas/estilo-correo";

/**
 * Invitación a elegir horario para la videollamada.
 *
 * Sobria en color (verde, hueso y un solo acento lima) y cuidada en la
 * estructura, porque este correo es la primera muestra de cómo trabajamos:
 *  · una franja de datos (duración, formato, costo) que responde lo práctico
 *    antes de que se pregunte;
 *  · el proceso en tres pasos numerados, porque es una secuencia real;
 *  · los horarios como una hoja de calendario: una columna por día con el
 *    número grande, y las horas debajo.
 *
 * Cada hora lleva a calidev.dev/cita/<token>?h=<horario>, donde se CONFIRMA
 * con otro botón: los filtros de correo abren enlaces para revisarlos, y si el
 * enlace reservara solo, reservarían por la persona.
 *
 * Tablas y estilos en línea, que es lo único que respetan Gmail y Outlook.
 */

const SITIO = "https://calidev.dev";

const DIA_CORTO = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: ZONA_COLOMBIA });
const NUMERO = new Intl.DateTimeFormat("es-CO", { day: "numeric", timeZone: ZONA_COLOMBIA });
const MES = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: ZONA_COLOMBIA });

function columnas(lista: Horario[]): { clave: string; horarios: Horario[] }[] {
  const grupos: { clave: string; horarios: Horario[] }[] = [];
  for (const h of lista) {
    const clave = h.id.slice(0, 10);
    const g = grupos.find((x) => x.clave === clave);
    if (g) g.horarios.push(h);
    else grupos.push({ clave, horarios: [h] });
  }
  return grupos;
}

const limpiar = (s: string) => s.replace(".", "").toUpperCase();


export function correoInvitacion(cita: Cita): Correo {
  const nombre = primerNombre(cita.nombre);
  const enlace = (id: string) => `${SITIO}/cita/${cita.token}?h=${encodeURIComponent(id)}`;
  const dias = columnas(horariosDeCita(cita).filter((h) => disponibleAun(h)));
  // La hoja de calendario va de tres en tres columnas; con más días, más filas.
  const filasDias: { clave: string; horarios: Horario[] }[][] = [];
  for (let i = 0; i < dias.length; i += 3) filasDias.push(dias.slice(i, i + 3));

  const pasos: [string, string, string][] = [
    ["01", "Videollamada", "Me cuentas cómo funciona tu negocio y sus procesos."],
    ["02", "Propuesta de trabajo", "Te envío las opciones que veo para tu caso."],
    ["03", "Propuesta formal", "Con presupuesto, cuando elijas la opción que te sirva."],
  ];

  const datos: [string, string][] = [
    ["Duración", "1 hora"],
    ["Formato", "Google Meet"],
    ["Costo", "Gratuita"],
  ];

  const celdaDato = ([k, v]: [string, string], i: number) => `
    <td width="33%" valign="top" style="padding:14px 14px 14px ${i === 0 ? 0 : 14}px;${i < 2 ? `border-right:1px solid ${C.linea};` : ""}">
      <div style="font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.gris}">${k}</div>
      <div style="margin-top:4px;font-family:${FUENTE};font-size:15px;font-weight:700;color:${C.tinta}">${v}</div>
    </td>`;

  const filaPaso = ([n, t, d]: [string, string, string]) => `
    <tr>
      <td width="44" valign="top" style="padding:14px 0;border-top:1px solid ${C.niebla};font-family:${MONO};font-size:12px;color:${C.verde};font-weight:700">${n}</td>
      <td valign="top" style="padding:14px 0;border-top:1px solid ${C.niebla};font-family:${FUENTE}">
        <div style="font-size:15px;font-weight:700;color:${C.tinta}">${t}</div>
        <div style="margin-top:2px;font-size:14px;line-height:1.5;color:${C.gris}">${d}</div>
      </td>
    </tr>`;

  const columnaDia = (d: { clave: string; horarios: Horario[] }, i: number, fila: unknown[]) => {
    const f = d.horarios[0].inicio;
    const horas = d.horarios
      .map(
        (h) => `
        <tr><td style="padding:0 0 8px">
          <a href="${enlace(h.id)}" style="display:block;text-align:center;border:1.5px solid ${C.verde};border-radius:10px;padding:10px 4px;font-family:${FUENTE};font-size:14px;font-weight:700;color:${C.verde};text-decoration:none;background:#ffffff">${horaCompacta(h.inicio)}</a>
        </td></tr>`
      )
      .join("");
    return `
      <td width="33%" valign="top" style="padding:0 ${i < fila.length - 1 ? 6 : 0}px 0 ${i > 0 ? 6 : 0}px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.hueso};border:1px solid ${C.linea};border-radius:14px">
          <tr><td align="center" style="padding:12px 8px 10px;border-bottom:1px solid ${C.linea}">
            <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;color:${C.gris}">${limpiar(DIA_CORTO.format(f))}</div>
            <div style="font-family:${FUENTE};font-size:30px;line-height:1.1;font-weight:800;color:${C.tinta}">${NUMERO.format(f)}</div>
            <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;color:${C.gris}">${limpiar(MES.format(f))}</div>
          </td></tr>
          <tr><td style="padding:10px 8px 2px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${horas}</table>
          </td></tr>
        </table>
      </td>`;
  };

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conozcamos tu negocio</title></head>
<body style="margin:0;padding:0;background:${C.niebla}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapar(
    "Videollamada gratuita de 1 hora para conocer tu negocio. Elige el horario que te quede mejor."
  )}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.niebla}">
    <tr><td align="center" style="padding:28px 12px">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
        <tr>
          <td style="padding:0 4px 14px;font-family:${FUENTE};font-size:15px;font-weight:800;color:${C.tinta}">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${C.lima};border:1.5px solid ${C.verde};margin-right:7px;vertical-align:1px"></span>CaliDev
          </td>
          <td align="right" style="padding:0 4px 14px;font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${C.gris}">Invitación</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden">
        <tr><td style="background:${C.verde};padding:34px 28px 30px">
          <div style="width:32px;height:3px;background:${C.lima};border-radius:2px"></div>
          <div style="margin-top:18px;font-family:${FUENTE};font-size:30px;line-height:1.12;font-weight:800;letter-spacing:-.5px;color:${C.hueso}">${escapar(nombre)}, conozcamos tu negocio.</div>
          <div style="margin-top:12px;font-family:${FUENTE};font-size:15.5px;line-height:1.55;color:#C9D6CF">Gracias por escribirme por Instagram. Te propongo una videollamada para entender cómo trabajan hoy y qué te gustaría cambiar.</div>
        </td></tr>

        <tr><td style="padding:0 28px;border-bottom:1px solid ${C.linea}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr>${datos.map(celdaDato).join("")}</tr></table>
        </td></tr>

        <tr><td style="padding:26px 28px 6px">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${C.gris};margin-bottom:6px">Cómo trabajamos</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pasos.map(filaPaso).join("")}</table>
        </td></tr>

        <tr><td style="padding:22px 28px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${C.gris}">Elige tu horario</td>
            <td align="right" style="font-family:${MONO};font-size:10.5px;letter-spacing:.06em;color:${C.gris}">Hora de Colombia</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:6px 28px 0">
          ${filasDias
            .map(
              (fila, n) =>
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;${n > 0 ? "margin-top:12px" : ""}"><tr>${fila
                  .map((d, i) => columnaDia(d, i, fila))
                  .join("")}${"<td width=\"33%\"></td>".repeat(3 - fila.length)}</tr></table>`
            )
            .join("")}
          <div style="margin-top:12px;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">Toca una hora y confírmala en la página. Te llega la invitación a tu calendario con el enlace de la videollamada.</div>
        </td></tr>

        <tr><td style="padding:26px 28px 30px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.niebla}"><tr>
            <td width="52" valign="middle" style="padding-top:20px">
              <div style="width:40px;height:40px;line-height:40px;border-radius:50%;background:${C.verde};color:${C.lima};text-align:center;font-family:${FUENTE};font-weight:800;font-size:16px">V</div>
            </td>
            <td valign="middle" style="padding-top:20px;font-family:${FUENTE}">
              <div style="font-size:15px;font-weight:700;color:${C.tinta}">Víctor Ramos</div>
              <div style="font-size:13.5px;color:${C.gris}">CaliDev · <a href="${SITIO}" style="color:${C.verde};text-decoration:none">calidev.dev</a></div>
            </td>
          </tr></table>
          <div style="margin-top:18px;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">¿Ninguno de estos horarios te sirve? Responde este correo y buscamos otro.</div>
        </td></tr>
      </table>

      <div style="max-width:540px;margin-top:14px;font-family:${FUENTE};font-size:12px;line-height:1.5;color:${C.gris}">Recibes este correo porque le escribiste a CaliDev por Instagram.</div>
    </td></tr>
  </table>
</body></html>`;

  const texto = [
    `${nombre}, conozcamos tu negocio.`,
    "",
    "Gracias por escribirme por Instagram. Te propongo una videollamada para entender cómo trabajan hoy y qué te gustaría cambiar.",
    "",
    "Duración: 1 hora · Formato: Google Meet · Costo: gratuita",
    "",
    "Cómo trabajamos:",
    ...pasos.map(([n, t, d]) => `${n}  ${t}: ${d}`),
    "",
    "Elige tu horario (hora de Colombia):",
    ...dias.flatMap((d) => [
      `${limpiar(DIA_CORTO.format(d.horarios[0].inicio))} ${NUMERO.format(d.horarios[0].inicio)}`,
      ...d.horarios.map((h) => `  ${horaCompacta(h.inicio)}: ${enlace(h.id)}`),
    ]),
    "",
    "¿Ninguno te sirve? Responde este correo y buscamos otro.",
    "",
    "Víctor Ramos",
    "CaliDev · calidev.dev",
  ].join("\n");

  return { para: cita.correo, asunto: `${nombre}, elige el horario de nuestra videollamada`, texto, html };
}
