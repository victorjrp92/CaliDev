import { ErrorCrm } from "./actor";

/**
 * Plata en el CRM: monedas admitidas, lectura de montos que llegan de un
 * formulario, de la CLI o de un agente, y paso a COP o EUR con las tasas
 * guardadas en cada registro (ver la convención en esquema.ts).
 */
export const MONEDAS = ["COP", "EUR", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];

export function moneda(v: unknown, campo = "moneda"): Moneda {
  const m = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (!(MONEDAS as readonly string[]).includes(m)) throw new ErrorCrm(400, "campo_invalido", "Moneda: COP, EUR o USD.", campo);
  return m as Moneda;
}

/**
 * Un monto: número, o texto como «2.500.000», «2500000» o «19,90».
 * El punto se toma como separador de miles y la coma como decimal (así se
 * escribe en Colombia); un número de JS se toma tal cual.
 */
export function monto(v: unknown, campo: string, o: { requerido?: boolean; positivo?: boolean } = {}): number | null {
  if (v === undefined || v === null || v === "") {
    if (o.requerido) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo} (un número, p. ej. 2500000).`, campo);
    return null;
  }
  const n = typeof v === "number" ? v : Number(String(v).replace(/[.\s]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || (o.positivo && n === 0)) {
    throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un número ${o.positivo ? "mayor que 0" : "positivo"} (COP sin puntos: 2500000).`, campo);
  }
  return Math.round(n * 100) / 100;
}

/** Fecha AAAA-MM-DD válida o error con el campo. */
export function dia(v: unknown, campo: string, o: { requerido?: boolean } = {}): string | null {
  if (v === undefined || v === null || v === "") {
    if (o.requerido) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo} (AAAA-MM-DD).`, campo);
    return null;
  }
  const s = String(v).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T12:00:00Z`)) || new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) !== s) {
    throw new ErrorCrm(400, "campo_invalido", `${campo}: una fecha AAAA-MM-DD.`, campo);
  }
  return s;
}

const redondear = (n: number) => Math.round(n * 100) / 100;
export const aCop = (valor: number | string, tasaCop: number | string) => redondear(Number(valor) * Number(tasaCop));
export const aEur = (valor: number | string, tasaCop: number | string, tasaEur: number | string) => redondear((Number(valor) * Number(tasaCop)) / Number(tasaEur));
