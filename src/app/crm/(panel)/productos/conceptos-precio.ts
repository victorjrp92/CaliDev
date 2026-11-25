import type { ConceptoPrecio } from "@/lib/crm/catalogo";

/** Los conceptos de precio y su nombre; el módulo del catálogo trae la base y no puede ir al navegador. */
export const CONCEPTOS_PRECIO = ["arranque", "mensualidad", "persona_adicional"] as const satisfies readonly ConceptoPrecio[];
export const NOMBRE_PRECIO: Record<ConceptoPrecio, string> = { arranque: "Arranque", mensualidad: "Mensualidad", persona_adicional: "Persona adicional" };
