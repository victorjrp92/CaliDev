import type { Valores } from "@/lib/arranque/esquema";

/**
 * Listas que se arman eligiendo (los trámites de SeiriLegal): de lo marcado
 * arriba a los elementos de la lista. Lo ya llenado se conserva tal cual; lo
 * nuevo nace con sus valores por defecto; lo desmarcado sale de la lista, pero
 * queda en `apartados` para recuperarlo igual si se vuelve a marcar.
 */
export function elegidos(items: readonly Valores[], campo: string): string[] {
  return [...new Set(items.map((it) => it[campo]).filter((x): x is string => typeof x === "string" && x !== ""))];
}

export function aplicarEleccion(
  items: readonly Valores[],
  seleccion: readonly string[],
  campo: string,
  alElegir: Readonly<Record<string, Valores>> = {},
  apartados: Readonly<Record<string, Valores>> = {},
): { items: Valores[]; apartados: Record<string, Valores> } {
  const guardados = { ...apartados };
  const quedan = items.filter((it) => {
    const v = it[campo];
    // Un elemento sin opción elegida (de antes de este modo) no se toca.
    if (typeof v !== "string" || v === "") return true;
    if (seleccion.includes(v)) return true;
    guardados[v] = it;
    return false;
  });
  const ya = new Set(elegidos(quedan, campo));
  const nuevos = seleccion
    .filter((o) => !ya.has(o))
    .map((o) => {
      const previo = guardados[o];
      delete guardados[o];
      return previo ?? { ...structuredClone(alElegir[o] ?? {}), [campo]: o };
    });
  return { items: [...quedan, ...nuevos], apartados: guardados };
}
