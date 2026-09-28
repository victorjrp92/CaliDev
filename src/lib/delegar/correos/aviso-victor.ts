import { etiquetaDelegar } from "@/lib/delegar/preguntas";
import type { Prioridad } from "@/lib/delegar/prioridad";
import { CORREO_VICTOR, envolver, escapar, type Correo } from "@/lib/delegar/correos/enviar";
import { primerNombre, type LeadDelegar } from "@/lib/delegar/correos/lead";

/**
 * Aviso para Víctor cada vez que entra o se completa un lead.
 *
 * Existe porque sin él solo se entera entrando al panel, y un lead caliente se
 * enfría en horas. El asunto dice la prioridad y quién es, para decidir desde
 * la bandeja sin abrirlo; el cuerpo trae las respuestas y un botón que abre
 * WhatsApp con el saludo ya escrito.
 */

const PANEL = "https://calidev.dev/servinomic/limpiaexpress/leads";

const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  alta: "Prioridad alta",
  media: "Potencial medio",
  exploracion: "Exploración",
  incompleta: "Sin terminar",
};

function enlaceWhatsapp(l: LeadDelegar): string {
  const saludo = `Hola ${primerNombre(l.name)}, soy Víctor de CaliDev. Recibí tu solicitud después del video de Deisy.`;
  return `https://wa.me/${l.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(saludo)}`;
}

function filas(l: LeadDelegar): [string, string][] {
  const conOtro = (base: string, otro: string | null) => (otro ? `${base}: ${otro}` : base);
  return [
    ["WhatsApp", l.whatsapp],
    ["Correo", l.email ?? "—"],
    ["País", l.country_other ?? "—"],
    ["Empresa", l.company ?? "—"],
    ["Papel", etiquetaDelegar("rol", l.role)],
    ["Negocio", l.actividad ?? "—"],
    ["Equipo", etiquetaDelegar("tamano", l.staff)],
    ["Resolver primero", conOtro(etiquetaDelegar("dolor", l.dolor), l.dolor_otro)],
    ["Organiza con", conOtro(etiquetaDelegar("herramientas", l.herramientas), l.herramientas_otro)],
    ["Busca", etiquetaDelegar("busca", l.busca)],
    ["Plazo", etiquetaDelegar("plazo", l.plazo)],
    ["Origen", l.utm ?? "—"],
  ];
}

function armar(l: LeadDelegar, asunto: string, entrada: string): Correo {
  const datos = filas(l);
  const texto = [
    entrada,
    "",
    l.prioridad_motivo ?? "",
    "",
    ...datos.map(([k, v]) => `${k}: ${v}`),
    "",
    `Escribir por WhatsApp: ${enlaceWhatsapp(l)}`,
    `Panel: ${PANEL}`,
  ].join("\n");

  const html = envolver(`
    <p style="margin:0 0 6px"><strong>${escapar(entrada)}</strong></p>
    <p style="margin:0 0 16px;color:#46554D">${escapar(l.prioridad_motivo ?? "")}</p>
    <table style="border-collapse:collapse;font-size:14.5px;width:100%">
      ${datos
        .map(
          ([k, v]) =>
            `<tr><td style="padding:5px 12px 5px 0;color:#46554D;vertical-align:top;white-space:nowrap">${escapar(k)}</td><td style="padding:5px 0">${escapar(v)}</td></tr>`
        )
        .join("")}
    </table>
    <p style="margin:20px 0 8px"><a href="${enlaceWhatsapp(l)}" style="display:inline-block;background:#C8F045;color:#14201B;font-weight:700;padding:12px 18px;border-radius:12px;text-decoration:none">Escribir a ${escapar(primerNombre(l.name))} por WhatsApp</a></p>
    <p style="margin:0;font-size:13px"><a href="${PANEL}" style="color:#0A3D2E">Abrir el panel de leads</a></p>
  `);

  return { para: CORREO_VICTOR, asunto, texto, html };
}

const negocio = (l: LeadDelegar) => (l.actividad ? ` · ${l.actividad}` : "");

/** Paso 2: dejó el contacto. Puede no terminar; así no se pierde. */
export function avisoNuevoContacto(l: LeadDelegar): Correo {
  return armar(
    l,
    `Nuevo contacto · ${l.name}${negocio(l)} (sin terminar)`,
    `${l.name} dejó su contacto y está llenando el paso 3.`
  );
}

/** Paso 3: solicitud completa, con su prioridad en el asunto. */
export function avisoLeadCompleto(l: LeadDelegar): Correo {
  const prioridad = NOMBRE_PRIORIDAD[l.prioridad ?? "incompleta"];
  return armar(l, `${prioridad} · ${l.name}${negocio(l)}`, `${l.name} completó la solicitud.`);
}

/** Corrigió su número desde la confirmación: el aviso anterior quedó con el viejo. */
export function avisoNumeroCorregido(l: LeadDelegar, anterior: string): Correo {
  return armar(
    l,
    `Número corregido · ${l.name}${negocio(l)}`,
    `${l.name} corrigió su WhatsApp: antes ${anterior}, ahora ${l.whatsapp}.`
  );
}
