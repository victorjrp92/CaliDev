import { SECCIONES, type Campo, type Respuestas, type Seccion, type Valores } from "@/lib/arranque/esquema";
import { leerArchivo, leerMuestra, urlPermitida } from "@/lib/arranque/archivos";
import { TIPOS_MUESTRA } from "@/lib/arranque/esquema-seirilegal";

/**
 * Validación del formulario de arranque. Funciones puras: las usan el
 * navegador (para avisar al instante) y el servidor (que es el que decide qué
 * sección está completa). Los mensajes dicen qué arreglar, no solo que hay un
 * error.
 */

export function visible(c: Campo, v: Valores): boolean {
  if (!c.visibleSi) return true;
  const actual = v[c.visibleSi.campo];
  // Preguntas de varias respuestas («opciones») guardan una lista: basta con que una coincida.
  if (Array.isArray(actual)) return actual.some((x) => typeof x === "string" && c.visibleSi!.valores.includes(x));
  return typeof actual === "string" && c.visibleSi.valores.includes(actual);
}

const soloDigitos = (s: string) => s.replace(/\D/g, "");

/** Error de un campo, o null si está bien. */
export function errorCampo(c: Campo, v: Valores): string | null {
  if (!visible(c, v)) return null;
  const valor = v[c.id];
  const vacio = valor === undefined || (Array.isArray(valor) ? valor.length === 0 : valor.trim() === "");
  if (c.tipo === "archivos" || c.tipo === "muestras") {
    const n = Array.isArray(valor) ? valor.length : 0;
    const minimo = c.minimo ?? (c.requerido ? 1 : 0);
    if (n >= minimo) return null;
    if (c.tipo === "archivos") return "Sube al menos un archivo.";
    return n === 0 ? `Sube al menos ${minimo} documentos.` : `Llevas ${n}: faltan ${minimo - n} para llegar a ${minimo}.`;
  }
  if (vacio) return c.requerido ? (c.tipo === "opcion" || c.tipo === "opciones" ? "Elige una opción." : "Este dato es necesario.") : null;
  const t = Array.isArray(valor) ? "" : valor.trim();
  switch (c.tipo) {
    case "correo":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? null : "Revisa el correo: debe verse como nombre@correo.com.";
    case "celular": {
      const d = soloDigitos(t).replace(/^57(?=3\d{9}$)/, "");
      return /^3\d{9}$/.test(d) || (t.startsWith("+") && d.length >= 8 && d.length <= 15) ? null : "Escribe el celular con sus 10 dígitos (empieza por 3).";
    }
    case "telefono": {
      const d = soloDigitos(t);
      return d.length >= 9 && d.length <= 15 && /^[+\d\s().-]+$/.test(t) ? null : "Escribe el teléfono con su prefijo, por ejemplo +34 600 000 000.";
    }
    case "documento":
      return /^\d{5,12}$/.test(soloDigitos(t)) && !/[a-z]/i.test(t.replace(/^(cc|ce|nit|pp)\s*/i, "")) ? null : "Escribe solo los números del documento (entre 5 y 12).";
    case "numero":
      return /^\d{1,6}$/.test(t) ? null : "Escribe solo un número.";
    case "pesos":
      return /^\d{3,10}$/.test(soloDigitos(t)) && Number(soloDigitos(t)) > 0 ? null : "Escribe el valor en pesos, solo números.";
    case "porcentaje": {
      const n = Number(t.replace(",", ".").replace("%", ""));
      return Number.isFinite(n) && n >= 0 && n <= 100 ? null : "Debe ser un número entre 0 y 100.";
    }
    case "fecha":
      return /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t)) ? null : "Elige una fecha válida.";
    case "opcion":
      return c.opciones?.includes(t) ? null : "Elige una de las opciones.";
    case "opciones":
      return Array.isArray(valor) && valor.every((x) => c.opciones?.includes(x)) ? null : "Elige entre las opciones.";
    default:
      return t.length <= 1000 ? null : "Es muy largo; resúmelo un poco.";
  }
}

export function erroresValores(campos: readonly Campo[], v: Valores): Record<string, string> {
  const e: Record<string, string> = {};
  for (const c of campos) {
    const x = errorCampo(c, v);
    if (x) e[c.id] = x;
  }
  return e;
}

/** ¿La sección cumple todo? Las listas piden su mínimo y cada elemento sin errores. */
export function seccionCompleta(s: Seccion, r: Respuestas): boolean {
  const valor = r[s.id];
  if (s.tipo === "lista") {
    const items = Array.isArray(valor) ? valor : [];
    return items.length >= (s.item?.minimo ?? 1) && items.every((it) => Object.keys(erroresValores(s.campos, it)).length === 0);
  }
  const v = valor && !Array.isArray(valor) ? valor : {};
  return Object.keys(erroresValores(s.campos, v)).length === 0;
}

export function avance(r: Respuestas, secciones: readonly Seccion[] = SECCIONES): { completas: string[]; porcentaje: number } {
  const completas = secciones.filter((s) => seccionCompleta(s, r)).map((s) => s.id);
  return { completas, porcentaje: Math.round((completas.length / secciones.length) * 100) };
}

/** Archivos subidos: solo los de la carpeta de este enlace, reescritos con lo que conocemos. */
function limpiarArchivos(c: Campo, x: unknown, token: string): string[] {
  if (!Array.isArray(x)) return [];
  const out: string[] = [];
  for (const y of x.slice(0, 60)) {
    if (c.tipo === "archivos") {
      const a = leerArchivo(y);
      if (a && urlPermitida(a.url, token)) out.push(JSON.stringify({ url: a.url, nombre: a.nombre.slice(0, 120) }));
    } else {
      const m = leerMuestra(y);
      if (m && TIPOS_MUESTRA.some((t) => t.tipo === m.tipo) && m.paginas.length <= 10 && m.paginas.every((p) => urlPermitida(p, token))) {
        out.push(JSON.stringify({ tipo: m.tipo, paginas: m.paginas }));
      }
    }
  }
  return out;
}

/**
 * Lo que manda el navegador, reducido a lo que el esquema conoce: solo campos
 * existentes, textos recortados, opciones válidas y archivos de su propia
 * carpeta. Nunca se guarda nada más.
 */
function limpiarValores(campos: readonly Campo[], v: unknown, token: string): Valores {
  const o = (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
  const r: Valores = {};
  for (const c of campos) {
    const x = o[c.id];
    if (c.tipo === "archivos" || c.tipo === "muestras") {
      if (Array.isArray(x)) r[c.id] = limpiarArchivos(c, x, token);
    } else if (c.tipo === "opciones") {
      if (Array.isArray(x)) r[c.id] = x.filter((y): y is string => typeof y === "string" && Boolean(c.opciones?.includes(y)));
    } else if (typeof x === "string" || typeof x === "number") {
      r[c.id] = String(x).slice(0, c.tipo === "area" ? 1000 : 200);
    }
  }
  return r;
}

export function limpiarSeccion(s: Seccion, valor: unknown, token = ""): Valores | Valores[] {
  if (s.tipo === "lista") return (Array.isArray(valor) ? valor : []).slice(0, 500).map((it) => limpiarValores(s.campos, it, token));
  return limpiarValores(s.campos, valor, token);
}
