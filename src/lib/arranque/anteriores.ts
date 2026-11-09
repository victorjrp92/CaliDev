import type { Respuestas, Seccion } from "@/lib/arranque/esquema";

/**
 * Lo guardado que el esquema actual ya no pregunta: secciones o campos que se
 * quitaron después de que el cliente respondiera. El guardado nunca lo borra
 * (cada sección se guarda por separado), y el panel lo muestra aparte para que
 * ninguna respuesta se pierda de vista al simplificar un formulario.
 */
/** `indice`: el elemento de una lista (desde 1), si la sección era una lista. */
export type Anterior = { seccion: string; campo: string; indice?: number; valor: string | string[] };

const lleno = (v: unknown): v is string | string[] =>
  typeof v === "string" ? v.trim() !== "" : Array.isArray(v) && v.some((x) => typeof x === "string" && x.trim() !== "");

export function respuestasAnteriores(r: Respuestas, secciones: readonly Seccion[]): Anterior[] {
  const out: Anterior[] = [];
  for (const [id, valor] of Object.entries(r)) {
    const s = secciones.find((x) => x.id === id);
    const conocidos = new Set(s?.campos.map((c) => c.id) ?? []);
    const items = Array.isArray(valor) ? valor : [valor];
    items.forEach((it, i) => {
      if (!it || typeof it !== "object") return;
      for (const [campo, v] of Object.entries(it)) {
        if (conocidos.has(campo) || !lleno(v)) continue;
        out.push({ seccion: id, campo, indice: Array.isArray(valor) ? i + 1 : undefined, valor: v });
      }
    });
  }
  return out;
}
