import { SECCIONES, type Seccion } from "@/lib/arranque/esquema";
import { SECCIONES_SEIRILEGAL } from "@/lib/arranque/esquema-seirilegal";

/**
 * Un arranque por producto: cada plantilla trae sus secciones y los textos que
 * cambian entre productos. El panel, el guardado y el envío son los mismos;
 * así cada cliente nuevo pasa por el mismo protocolo, venga del producto que
 * venga.
 */
export type Plantilla = {
  id: string;
  producto: string;
  secciones: readonly Seccion[];
  /** Lo que se le promete en la bienvenida, además de que se guarda solo. */
  bienvenida: string;
  puntos: readonly string[];
  /** Lo que se le dice al enviar. */
  gracias: string;
};

export const PLANTILLAS: Record<string, Plantilla> = {
  servinomic: {
    id: "servinomic",
    producto: "ServiNomic",
    secciones: SECCIONES,
    bienvenida: "Son {n} pasos cortos sobre tu negocio, tu equipo y tus clientes. Con esto dejamos ServiNomic configurado a tu manera.",
    puntos: ["Se guarda solo: puedes cerrar y seguir después con este mismo enlace.", "Si no sabes algo, sigue adelante y lo completas luego.", "Para listas largas puedes subir un Excel."],
    gracias: "Recibimos toda la información. Con esto empezamos a configurar ServiNomic para tu negocio y te contamos cuando esté lista para la capacitación.",
  },
  seirilegal: {
    id: "seirilegal",
    producto: "SeiriLegal",
    secciones: SECCIONES_SEIRILEGAL,
    bienvenida: "Son {n} pasos sobre tu despacho, tus trámites y tus documentos. Con esto dejamos SeiriLegal configurado a tu forma de trabajar.",
    puntos: [
      "Se guarda solo: puedes cerrar y seguir después con este mismo enlace.",
      "Si no sabes algo, sigue adelante y lo completas luego.",
      "Los datos de tus clientes los tapas tú antes de subir nada.",
    ],
    gracias: "Recibimos toda la información. Con esto configuramos SeiriLegal para tu despacho y te escribimos para la llamada de los plazos.",
  },
};

export function plantillaDe(id: string | null | undefined): Plantilla {
  return PLANTILLAS[id ?? ""] ?? PLANTILLAS.servinomic;
}
