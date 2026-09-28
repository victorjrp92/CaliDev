import { valoresDelegar } from "@/lib/delegar/preguntas";
import { envolver, escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre, type LeadDelegar } from "@/lib/delegar/correos/lead";

/**
 * Confirmación para quien completó la solicitud, solo si dejó correo (es
 * opcional).
 *
 * Le devuelve lo que contó con sus palabras, le dice qué sigue sin prometer un
 * plazo —igual que la página— y le deja el caso de Deisy a mano. Del caso solo
 * horas y personas, nunca ingresos. Firma Víctor: la recomendación de Deisy
 * fue sobre él.
 */

const DOLOR_EN_SEGUNDA: Record<string, string> = {
  tiempo: "todo pasa por ti y te falta tiempo",
  delegar: "intentas delegar, pero terminas haciéndolo tú",
  crecer: "quieren crecer y la operación se desordena",
  tecnologia: "buscas una app, software o página web que te quite trabajo",
};

const HERRAMIENTA_EN_FRASE: Record<string, string> = {
  papel: "papel, libretas o memoria",
  excel: "Excel o Google Sheets",
  whatsapp: "WhatsApp",
  programas: "uno o varios programas",
};

function unir(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/** «Nos contaste que …». Solo con lo que la persona respondió; nunca inventa. */
function loQueContaste(l: LeadDelegar): string | null {
  const dolor =
    l.dolor === "otro" && l.dolor_otro
      ? `lo primero que quieres resolver es: «${l.dolor_otro}»`
      : DOLOR_EN_SEGUNDA[l.dolor ?? ""];

  const herramientas = valoresDelegar(l.herramientas)
    .map((v) => (v === "otro" ? l.herramientas_otro : HERRAMIENTA_EN_FRASE[v]))
    .filter((v): v is string => Boolean(v));

  const partes: string[] = [];
  if (dolor) partes.push(dolor);
  if (herramientas.length) partes.push(`hoy organizas el trabajo con ${unir(herramientas)}`);
  return partes.length ? `Nos contaste que ${partes.join(", y que ")}.` : null;
}

export function confirmacionLead(l: LeadDelegar): Correo | null {
  if (!l.email) return null;

  const nombre = primerNombre(l.name);
  const contaste = loQueContaste(l);
  const siguiente = `Te escribimos por WhatsApp al ${l.whatsapp}. Si procede, coordinamos una llamada de 30 minutos para revisar qué conviene para tu caso particular.`;
  const caso =
    "Lo que viste en el video de Deisy: en LimpiaExpress recuperaron 40 horas de trabajo por semana y el equipo pasó de 10 a 22 colaboradoras.";
  const adelantar = "Si quieres adelantar algo, responde este correo y me llega directo.";

  const texto = [
    `Hola ${nombre},`,
    "",
    "Recibimos tu solicitud.",
    ...(contaste ? ["", contaste] : []),
    "",
    siguiente,
    "",
    caso,
    "",
    adelantar,
    "",
    "Víctor",
    "CaliDev · calidev.dev",
  ].join("\n");

  const html = envolver(`
    <p>Hola ${escapar(nombre)},</p>
    <p>Recibimos tu solicitud.${contaste ? ` ${escapar(contaste)}` : ""}</p>
    <p><strong>Qué sigue:</strong> ${escapar(siguiente)}</p>
    <p style="color:#46554D">${escapar(caso)}</p>
    <p>${escapar(adelantar)}</p>
    <p style="margin-top:24px">Víctor<br><span style="color:#46554D">CaliDev · <a href="https://calidev.dev" style="color:#0A3D2E">calidev.dev</a></span></p>
  `);

  return { para: l.email, asunto: `Recibimos tu solicitud, ${nombre}`, texto, html };
}
