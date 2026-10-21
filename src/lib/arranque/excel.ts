import type { Campo, Valores } from "@/lib/arranque/esquema";

/**
 * Convierte las filas de un Excel en elementos de una lista del formulario.
 * La primera fila con texto son los títulos; se reconocen por la etiqueta del
 * campo, su id o sus alias, sin importar mayúsculas, tildes ni signos. Lo que
 * no se reconoce se informa para que la persona sepa qué columna se ignoró.
 *
 * Nada se da por bueno: los elementos llegan al formulario y pasan por la
 * misma validación que si se hubieran escrito a mano.
 */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();

function columnaDe(titulo: string, campos: readonly Campo[]): Campo | undefined {
  const t = norm(titulo);
  if (!t) return undefined;
  return campos.find((c) => [c.etiqueta, c.id, ...(c.alias ?? [])].some((x) => norm(x) === t));
}

function fechaIso(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function valorDe(c: Campo, celda: unknown): string | string[] | undefined {
  if (celda === null || celda === undefined || celda === "") return undefined;
  if (c.tipo === "fecha") {
    if (celda instanceof Date) return fechaIso(celda);
    const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(String(celda).trim());
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : String(celda);
  }
  const texto = String(celda).trim();
  if (c.tipo === "opcion" || c.tipo === "opciones") {
    const n = norm(texto);
    const corto: Record<string, string> = { s: "si", x: "si", n: "no" };
    const buscado = corto[n] ?? n;
    const exacta = c.opciones?.find((o) => norm(o) === buscado);
    const parcial = exacta ?? c.opciones?.find((o) => norm(o).startsWith(buscado) || buscado.startsWith(norm(o)));
    const elegida = parcial ?? texto;
    return c.tipo === "opciones" ? [elegida] : elegida;
  }
  if (c.tipo === "pesos" || c.tipo === "documento") return texto.replace(/[^\d]/g, "");
  if (c.tipo === "porcentaje" && typeof celda === "number" && celda > 0 && celda <= 1) return String(Math.round(celda * 100));
  return texto;
}

export function filasAElementos(filas: unknown[][], campos: readonly Campo[]): { elementos: Valores[]; ignoradas: string[]; reconocidas: string[] } {
  const inicio = filas.findIndex((f) => f.some((x) => typeof x === "string" && x.trim()));
  if (inicio < 0) return { elementos: [], ignoradas: [], reconocidas: [] };
  const titulos = filas[inicio].map((x) => (x === null || x === undefined ? "" : String(x)));
  const mapa = titulos.map((t) => columnaDe(t, campos));
  const ignoradas = titulos.filter((t, i) => t.trim() && !mapa[i]);
  const reconocidas = mapa.filter((c): c is Campo => Boolean(c)).map((c) => c.etiqueta);
  const elementos = filas
    .slice(inicio + 1)
    .filter((f) => f.some((x) => x !== null && x !== undefined && String(x).trim() !== ""))
    .filter((f) => !String(f[0] ?? "").trim().toUpperCase().startsWith("EJEMPLO"))
    .map((f) => {
      const v: Valores = {};
      mapa.forEach((c, i) => {
        if (!c) return;
        const x = valorDe(c, f[i]);
        if (x !== undefined) v[c.id] = x;
      });
      return v;
    });
  return { elementos, ignoradas, reconocidas };
}
