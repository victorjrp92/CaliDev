import { etiquetaDelegar, valoresDelegar } from "@/lib/delegar/preguntas";
import { escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre, type LeadDelegar } from "@/lib/delegar/correos/lead";

/**
 * Confirmación para quien completó la solicitud, solo si dejó correo (es
 * opcional). Diseño «B · Ficha de seguimiento», elegido por Víctor el
 * 2026-09-28: número de solicitud, los cuatro pasos con el actual marcado, lo
 * que nos contó y la cita de Deisy.
 *
 * ── Hecho para las bandejas, no para el navegador ──
 *
 * Tablas y estilos en línea: es lo único que Gmail y Outlook respetan. Nada de
 * clases, flex ni fuentes web (Gmail no las carga; va la fuente del sistema).
 * El texto de vista previa va oculto al principio del cuerpo: es la línea gris
 * que se lee en la bandeja antes de abrir.
 *
 * Nada inventado: el número es el id real del lead, las respuestas son las
 * suyas y sin plazo de respuesta, igual que la página.
 */

const C = {
  verde: "#0A3D2E",
  lima: "#C8F045",
  hueso: "#FAFAF7",
  tinta: "#14201B",
  texto: "#2C3A33",
  gris: "#46554D",
  niebla: "#E6E8E3",
  linea: "#D8DCD4",
};
const FUENTE = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,monospace";

const DOLOR_EN_SEGUNDA: Record<string, string> = {
  tiempo: "Todo pasa por ti y te falta tiempo",
  delegar: "Intentas delegar, pero terminas haciéndolo tú",
  crecer: "Quieren crecer y la operación se desordena",
  tecnologia: "Buscas una app, software o página web que te quite trabajo",
};

const HERRAMIENTA: Record<string, string> = {
  papel: "papel, libretas o memoria",
  excel: "Excel",
  whatsapp: "WhatsApp",
  programas: "uno o varios programas",
};

function unir(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Las filas de «Lo que nos contaste». Solo las que la persona respondió. */
function loQueContaste(l: LeadDelegar): [string, string][] {
  const filas: [string, string][] = [];
  const dolor =
    l.dolor === "otro" && l.dolor_otro ? l.dolor_otro : DOLOR_EN_SEGUNDA[l.dolor ?? ""];
  if (dolor) filas.push(["Resolver primero", dolor]);

  const herramientas = valoresDelegar(l.herramientas)
    .map((v) => (v === "otro" ? l.herramientas_otro : HERRAMIENTA[v]))
    .filter((v): v is string => Boolean(v));
  if (herramientas.length) filas.push(["Organizas con", mayuscula(unir(herramientas))]);

  if (l.staff) {
    const equipo = etiquetaDelegar("tamano", l.staff);
    filas.push(["Equipo", l.staff === "solo" ? equipo : `${equipo} personas`]);
  }
  return filas;
}

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

type Paso = { titulo: string; detalle: string; estado: "hecho" | "ahora" | "luego" };

function filaPaso(p: Paso, numero: number, ultimo: boolean): string {
  const circulo =
    p.estado === "hecho"
      ? `background:${C.verde};color:${C.lima};border:2px solid ${C.verde}`
      : p.estado === "ahora"
        ? `background:#ffffff;color:${C.verde};border:2px solid ${C.verde}`
        : `background:#ffffff;color:${C.gris};border:2px solid ${C.linea}`;
  const marca = p.estado === "hecho" ? "&#10003;" : String(numero);
  const enCurso =
    p.estado === "ahora"
      ? ` <span style="font-family:${MONO};font-size:10px;letter-spacing:.06em;text-transform:uppercase;background:${C.lima};color:${C.tinta};padding:2px 7px;border-radius:99px">En curso</span>`
      : "";
  const linea = ultimo ? "" : `border-left:2px solid ${C.niebla};`;
  return `
    <tr>
      <td width="28" valign="top" style="padding:0">
        <div style="width:24px;height:24px;line-height:24px;border-radius:50%;text-align:center;font-size:12px;font-weight:800;font-family:${FUENTE};${circulo}">${marca}</div>
        <div style="height:${ultimo ? 0 : 18}px;margin-left:13px;${linea}"></div>
      </td>
      <td valign="top" style="padding:2px 0 ${ultimo ? 0 : 12}px 12px;font-family:${FUENTE}">
        <div style="font-size:15px;font-weight:700;color:${C.tinta}">${p.titulo}${enCurso}</div>
        <div style="font-size:13.5px;color:${C.gris};line-height:1.45">${p.detalle}</div>
      </td>
    </tr>`;
}

export function confirmacionLead(l: LeadDelegar, recibida = new Date()): Correo | null {
  if (!l.email) return null;

  const nombre = primerNombre(l.name);
  const numero = `#${String(l.id).padStart(4, "0")}`;
  const whatsapp = l.whatsapp;
  const contaste = loQueContaste(l);
  const adelantar =
    "¿Quieres contarnos algo más antes de que te escribamos? Responde este correo y me llega directo.";
  const cita = "«Cali Dev entendió que mi problema no era de ventas, era de tiempo y herramientas.»";
  const autora = "Deisy Moncayo · CEO, LimpiaExpress Cali";

  const pasos: Paso[] = [
    { titulo: "Recibida", detalle: "Tus respuestas llegaron completas.", estado: "hecho" },
    { titulo: "Revisamos tu caso", detalle: "Leemos lo que nos contaste, uno por uno.", estado: "ahora" },
    { titulo: "Te escribimos por WhatsApp", detalle: `Al ${escapar(whatsapp)}.`, estado: "luego" },
    { titulo: "Llamada de 30 minutos", detalle: "Si procede, la coordinamos contigo.", estado: "luego" },
  ];

  const vistaPrevia = `Paso 1 de 4 hecho. Estamos revisando tu caso; te escribimos por WhatsApp al ${whatsapp}.`;

  const texto = [
    `Solicitud ${numero} · ${FECHA.format(recibida)}`,
    `${nombre}, recibimos tu solicitud.`,
    "",
    "1. Recibida ✓ — Tus respuestas llegaron completas.",
    "2. Revisamos tu caso (en curso) — Leemos lo que nos contaste, uno por uno.",
    `3. Te escribimos por WhatsApp — Al ${whatsapp}.`,
    "4. Llamada de 30 minutos — Si procede, la coordinamos contigo.",
    "",
    "Lo que nos contaste:",
    ...contaste.map(([k, v]) => `· ${k}: ${v}`),
    "",
    `${cita}`,
    autora,
    "",
    adelantar,
    "",
    "Víctor",
    "CaliDev · calidev.dev",
  ].join("\n");

  const filasContaste = contaste
    .map(
      ([k, v]) => `
      <tr>
        <td width="38%" valign="top" style="padding:9px 10px 9px 0;border-top:1px solid ${C.niebla};font-size:14px;color:${C.gris};font-family:${FUENTE}">${escapar(k)}</td>
        <td valign="top" style="padding:9px 0;border-top:1px solid ${C.niebla};font-size:14px;color:${C.texto};font-family:${FUENTE}">${escapar(v)}</td>
      </tr>`
    )
    .join("");

  const etiqueta = (t: string) =>
    `<div style="font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.gris};margin:0 0 8px">${t}</div>`;

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solicitud ${numero}</title></head>
<body style="margin:0;padding:0;background:${C.niebla}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapar(vistaPrevia)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.niebla}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden">
        <tr><td style="background:${C.verde};padding:22px 24px 24px;font-family:${FUENTE}">
          <div style="font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.lima}">Solicitud ${numero} · ${FECHA.format(recibida)}</div>
          <div style="margin-top:10px;font-size:24px;line-height:1.2;font-weight:800;color:${C.hueso}">${escapar(nombre)}, recibimos tu solicitud.</div>
        </td></tr>
        <tr><td style="padding:24px 24px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${pasos.map((p, i) => filaPaso(p, i + 1, i === pasos.length - 1)).join("")}
          </table>
        </td></tr>
        ${
          contaste.length
            ? `<tr><td style="padding:16px 24px 0">
          ${etiqueta("Lo que nos contaste")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filasContaste}</table>
        </td></tr>`
            : ""
        }
        <tr><td style="padding:20px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.hueso};border:1px solid ${C.linea};border-left:3px solid ${C.verde};border-radius:12px">
            <tr><td style="padding:12px 14px;font-family:${FUENTE}">
              ${etiqueta("Lo que dijo Deisy")}
              <div style="font-size:15px;line-height:1.5;color:${C.tinta}">${cita}</div>
              <div style="margin-top:6px;font-size:12.5px;color:${C.gris}">${autora}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 24px 26px;font-family:${FUENTE};font-size:14.5px;line-height:1.55;color:${C.texto}">
          ${adelantar}
          <div style="margin-top:18px;font-weight:700;color:${C.tinta}">Víctor</div>
          <div style="color:${C.gris}">CaliDev · <a href="https://calidev.dev" style="color:${C.verde}">calidev.dev</a></div>
        </td></tr>
      </table>
      <div style="max-width:520px;margin-top:12px;font-family:${FUENTE};font-size:12px;color:${C.gris}">Recibes este correo porque enviaste una solicitud en calidev.dev.</div>
    </td></tr>
  </table>
</body></html>`;

  return { para: l.email, asunto: `Solicitud ${numero} recibida · ${nombre}`, texto, html };
}
