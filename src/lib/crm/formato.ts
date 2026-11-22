/**
 * Formato para la UI del CRM. Sin dependencias de servidor: lo usan páginas y
 * componentes de cliente. Las horas van en hora de Colombia, que es donde se
 * agendan las citas y donde están los clientes.
 */
export const ZONA = "America/Bogota";

type Fecha = string | Date | null | undefined;
const d = (v: Fecha) => (v ? new Date(v) : null);

export function fecha(v: Fecha): string {
  const x = d(v);
  return x ? new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short" }).format(x).replace(/\./g, "") : "—";
}

export function hora(v: Fecha): string {
  const x = d(v);
  return x ? new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, hour: "numeric", minute: "2-digit", hour12: true }).format(x).replace(/\s?a\.\s?m\./, " am").replace(/\s?p\.\s?m\./, " pm") : "—";
}

export const fechaHora = (v: Fecha) => (v ? `${fecha(v)} · ${hora(v)}` : "—");

/** Día largo para encabezados: «lunes 23 de noviembre». */
export function diaLargo(dia: string): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" }).format(new Date(`${dia}T12:00:00-05:00`));
}

const diaCol = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(x);

/** «hoy», «mañana», «en 3 d», «hace 2 d», contando días de calendario en Colombia. */
export function cuando(v: Fecha, ahora = new Date()): { texto: string; vencido: boolean } {
  const x = d(v);
  if (!x) return { texto: "sin fecha", vencido: false };
  const dias = Math.round((Date.parse(`${diaCol(x)}T00:00:00Z`) - Date.parse(`${diaCol(ahora)}T00:00:00Z`)) / 864e5);
  if (dias === 0) return { texto: "hoy", vencido: x.getTime() < ahora.getTime() };
  if (dias === 1) return { texto: "mañana", vencido: false };
  if (dias === -1) return { texto: "ayer", vencido: true };
  return dias > 0 ? { texto: `en ${dias} d`, vencido: false } : { texto: `hace ${-dias} d`, vencido: true };
}

export function plata(v: string | number | null | undefined, moneda = "COP"): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(moneda === "EUR" ? "de-DE" : "es-CO", { style: "currency", currency: moneda, maximumFractionDigits: moneda === "COP" ? 0 : 2 }).format(n);
}

/** Valor para un <input type="date"> en Colombia. */
export const paraInputFecha = (v: Fecha) => (d(v) ? diaCol(d(v)!) : "");
