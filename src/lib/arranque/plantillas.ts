import { SECCIONES, type Seccion } from "@/lib/arranque/esquema";
import { ANTERIORES_SEIRILEGAL, SECCIONES_SEIRILEGAL } from "@/lib/arranque/esquema-seirilegal";

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
  /**
   * Se puede enviar aunque falten secciones: lo que falte se ve en la
   * entrega. Sin esto, «Enviar» solo aparece con todo completo.
   */
  envioLibre?: boolean;
  /** Nombre de secciones (`seccion`) y preguntas (`seccion.campo`) que se quitaron, para el panel. */
  anteriores?: Readonly<Record<string, string>>;
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
    bienvenida: "Son {n} pasos cortos sobre tu despacho, tu equipo y tus trámites. Con esto dejamos SeiriLegal configurado a tu forma de trabajar.",
    puntos: [
      "Casi todo se responde tocando una opción.",
      "Se guarda solo: puedes cerrar y seguir después con este mismo enlace.",
      "Puedes enviarlo cuando quieras: lo que falte lo vemos en la entrega.",
    ],
    gracias: "Recibimos tu información. Con esto configuramos SeiriLegal para tu despacho y te escribimos por WhatsApp para acordar el día de la entrega.",
    envioLibre: true,
    anteriores: ANTERIORES_SEIRILEGAL,
  },
};

export function plantillaDe(id: string | null | undefined): Plantilla {
  return PLANTILLAS[id ?? ""] ?? PLANTILLAS.servinomic;
}
