import { escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { disponibleAun, horaCompacta, horariosDeCita } from "@/lib/citas/horarios";
import type { Cita } from "@/lib/citas/datos";
import { C, FUENTE, MONO } from "@/lib/citas/estilo-correo";
import { columnas, diaEnTexto, hojaCalendario } from "@/lib/citas/hoja-calendario";
import { NOMBRE_SESIONES, rotuloSesion } from "@/lib/citas/sesion";

/**
 * La invitación a las sesiones de un cliente: un solo correo con un bloque por
 * sesión, cada uno con los enlaces de su propia cita. Se elige una hora en cada
 * bloque y se confirma en la página, igual que en las demás invitaciones.
 *
 * Es algo que ya pagó, no una oferta: no habla de costo ni la presenta como
 * obligación. Tablas y estilos en línea por Gmail y Outlook.
 */
const SITIO = "https://calidev.dev";
const CANTIDAD = ["", "una", "dos", "tres", "cuatro", "cinco", "seis"];

export function correoSesiones(nombre: string, negocio: string, citas: Cita[]): Correo {
  const titulo = `${nombre}, agendemos tus ${NOMBRE_SESIONES}.`;
  const n = citas.length;
  const cuantas = CANTIDAD[n] ?? String(n);
  const entrada = `Son las ${cuantas} sesiones incluidas en tu contrato de ServiNomic: ${cuantas} horas dedicadas a ${negocio}, más allá de la app, para trabajar el crecimiento de tu empresa. Procesos, organización del equipo y lo que necesites priorizar. Te propongo una por semana, empezando la próxima, para que cada sesión aproveche lo que avancemos en la anterior.`;
  const cierre = "Toca una hora en cada sesión y confírmala en la página. Si una semana no te queda bien, responde este correo y buscamos otra fecha.";

  const bloques = citas.map((cita) => ({
    rotulo: rotuloSesion(cita),
    enlace: (id: string) => `${SITIO}/cita/${cita.token}?h=${encodeURIComponent(id)}`,
    dias: columnas(horariosDeCita(cita).filter((h) => disponibleAun(h))),
  }));

  const datos: [string, string][] = [
    ["Sesiones", `${n} de 1 hora`],
    ["Formato", "Google Meet"],
    ["Contrato", "Ya incluidas"],
  ];
  const celdaDato = ([k, v]: [string, string], i: number) => `
    <td width="33%" valign="top" style="padding:14px 14px 14px ${i === 0 ? 0 : 14}px;${i < 2 ? `border-right:1px solid ${C.linea};` : ""}">
      <div style="font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.gris}">${k}</div>
      <div style="margin-top:4px;font-family:${FUENTE};font-size:15px;font-weight:700;color:${C.tinta}">${v}</div>
    </td>`;

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(NOMBRE_SESIONES)}</title></head>
<body style="margin:0;padding:0;background:${C.niebla}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapar(`Elige la hora de tus ${n} sesiones incluidas en tu contrato: una por semana.`)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.niebla}">
    <tr><td align="center" style="padding:28px 12px">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
        <tr>
          <td style="padding:0 4px 14px;font-family:${FUENTE};font-size:15px;font-weight:800;color:${C.tinta}">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${C.lima};border:1.5px solid ${C.verde};margin-right:7px;vertical-align:1px"></span>CaliDev
          </td>
          <td align="right" style="padding:0 4px 14px;font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${C.gris}">Tu contrato</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden">
        <tr><td style="background:${C.verde};padding:34px 28px 30px">
          <div style="width:32px;height:3px;background:${C.lima};border-radius:2px"></div>
          <div style="margin-top:18px;font-family:${FUENTE};font-size:30px;line-height:1.12;font-weight:800;letter-spacing:-.5px;color:${C.hueso}">${escapar(titulo)}</div>
          <div style="margin-top:12px;font-family:${FUENTE};font-size:15.5px;line-height:1.55;color:#C9D6CF">${escapar(entrada)}</div>
        </td></tr>

        <tr><td style="padding:0 28px;border-bottom:1px solid ${C.linea}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr>${datos.map(celdaDato).join("")}</tr></table>
        </td></tr>

        ${bloques
          .map(
            (b) => `<tr><td style="padding:24px 28px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px"><tr>
            <td style="font-family:${FUENTE};font-size:18px;font-weight:800;color:${C.tinta}">${escapar(b.rotulo)}</td>
            <td align="right" style="font-family:${MONO};font-size:10.5px;letter-spacing:.06em;color:${C.gris}">Hora de Colombia</td>
          </tr></table>
          ${hojaCalendario(b.dias, b.enlace)}
        </td></tr>`
          )
          .join("\n        ")}

        <tr><td style="padding:18px 28px 0;font-family:${FUENTE};font-size:13.5px;line-height:1.5;color:${C.gris}">${escapar(cierre)}</td></tr>

        <tr><td style="padding:22px 28px 30px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.niebla}"><tr>
            <td width="52" valign="middle" style="padding-top:20px">
              <div style="width:40px;height:40px;line-height:40px;border-radius:50%;background:${C.verde};color:${C.lima};text-align:center;font-family:${FUENTE};font-weight:800;font-size:16px">V</div>
            </td>
            <td valign="middle" style="padding-top:20px;font-family:${FUENTE}">
              <div style="font-size:15px;font-weight:700;color:${C.tinta}">Víctor Ramos</div>
              <div style="font-size:13.5px;color:${C.gris}">CaliDev · <a href="${SITIO}" style="color:${C.verde};text-decoration:none">calidev.dev</a></div>
            </td>
          </tr></table>
        </td></tr>
      </table>

      <div style="max-width:540px;margin-top:14px;font-family:${FUENTE};font-size:12px;line-height:1.5;color:${C.gris}">Recibes este correo porque eres cliente de CaliDev.</div>
    </td></tr>
  </table>
</body></html>`;

  const texto = [
    titulo,
    "",
    entrada,
    "",
    ...bloques.flatMap((b) => [
      `${b.rotulo} (hora de Colombia):`,
      ...b.dias.flatMap((d) => [diaEnTexto(d.horarios[0].inicio), ...d.horarios.map((h) => `  ${horaCompacta(h.inicio)}: ${b.enlace(h.id)}`)]),
      "",
    ]),
    cierre,
    "",
    "Víctor Ramos",
    "CaliDev · calidev.dev",
  ].join("\n");

  return { para: citas[0].correo, asunto: titulo, texto, html };
}
