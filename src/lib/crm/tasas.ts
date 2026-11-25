import { sql } from "@/lib/db";
import { ErrorCrm } from "./actor";
import { diaColombia } from "./agenda";
import type { Moneda } from "./dinero";

/**
 * Tasas de cambio del día: pesos por 1 EUR y por 1 USD. Se guardan por día en
 * `crm_tasas`, así un cobro o gasto queda con la tasa de su fecha y el
 * proveedor se consulta como mucho una vez al día.
 *
 * Proveedores, sin clave ni dependencia nueva:
 * - hoy: open.er-api.com (base EUR);
 * - respaldo y días pasados: la currency-api de fawazahmed0 por jsDelivr
 *   (y su espejo en pages.dev).
 * Si todo falla se usa la última tasa guardada de los 7 días anteriores; si
 * tampoco hay, 503 `sin_tasa` y quien llama pasa `tasa_eur` a mano.
 */
export type Tasas = { dia: string; eur: number; usd: number; fuente: string };
type Cruda = { eur: number; usd: number; fuente: string };
export type Proveedor = (dia: string, esHoy: boolean) => Promise<Cruda | null>;

// Un peso por euro fuera de este rango es un error del proveedor, no una tasa.
const plausible = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 500 && n < 50_000;

async function leerJson(url: string): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(4000), cache: "no-store" });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

const proveedorReal: Proveedor = async (dia, esHoy) => {
  if (esHoy) {
    try {
      const j = (await leerJson("https://open.er-api.com/v6/latest/EUR")) as { rates?: Record<string, number> };
      const cop = j.rates?.COP;
      const usd = j.rates?.USD;
      if (plausible(cop) && usd && plausible(cop / usd)) return { eur: cop, usd: cop / usd, fuente: "open.er-api.com" };
    } catch {
      /* se prueba el respaldo */
    }
  }
  const v = esHoy ? "latest" : dia;
  for (const url of [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${v}/v1/currencies/eur.json`,
    `https://${v}.currency-api.pages.dev/v1/currencies/eur.json`,
  ]) {
    try {
      const j = (await leerJson(url)) as { eur?: { cop?: number; usd?: number } };
      const cop = j.eur?.cop;
      const usd = j.eur?.usd;
      if (plausible(cop) && usd && plausible(cop / usd)) return { eur: cop, usd: cop / usd, fuente: "currency-api" };
    } catch {
      /* siguiente */
    }
  }
  return null;
};

let proveedor: Proveedor = proveedorReal;

/** Para las pruebas: reemplaza la consulta a internet. */
export function usarProveedorTasas(fn: Proveedor | null) {
  proveedor = fn ?? proveedorReal;
}

type Fila = { moneda: "EUR" | "USD"; cop: string; fuente: string };

async function guardadas(d: string): Promise<Tasas | null> {
  const r = await sql<Fila>`SELECT moneda, cop, fuente FROM crm_tasas WHERE dia = ${d}`;
  const eur = r.rows.find((x) => x.moneda === "EUR");
  const usd = r.rows.find((x) => x.moneda === "USD");
  return eur && usd ? { dia: d, eur: Number(eur.cop), usd: Number(usd.cop), fuente: eur.fuente } : null;
}

async function ultimaConocida(d: string): Promise<Tasas | null> {
  const r = await sql<{ dia: string }>`
    SELECT dia::text AS dia FROM crm_tasas WHERE dia <= ${d} AND dia > (${d}::date - 7)
    GROUP BY dia HAVING COUNT(*) = 2 ORDER BY dia DESC LIMIT 1`;
  if (!r.rows[0]) return null;
  const t = await guardadas(r.rows[0].dia);
  return t && { ...t, dia: d, fuente: `${t.fuente} (del ${r.rows[0].dia})` };
}

/**
 * Las tasas de `dia` (AAAA-MM-DD; por defecto hoy en Colombia). Un día futuro
 * usa las de hoy. `manual` fija una o las dos a mano y no consulta nada para
 * esas monedas.
 */
export async function tasasDelDia(d?: string | null, manual: { eur?: number | null; usd?: number | null } = {}, ahora = new Date()): Promise<Tasas> {
  const hoy = diaColombia(null, ahora).dia;
  const dd = !d || d > hoy ? hoy : d;
  if (manual.eur && manual.usd) return { dia: dd, eur: manual.eur, usd: manual.usd, fuente: "manual" };

  let t = await guardadas(dd);
  if (!t) {
    const c = await proveedor(dd, dd === hoy).catch(() => null);
    if (c && plausible(c.eur) && plausible(c.usd)) {
      await sql`
        INSERT INTO crm_tasas (dia, moneda, cop, fuente) VALUES (${dd}, 'EUR', ${c.eur}, ${c.fuente}), (${dd}, 'USD', ${c.usd}, ${c.fuente})
        ON CONFLICT (dia, moneda) DO NOTHING`;
      t = (await guardadas(dd)) ?? { dia: dd, ...c };
    } else {
      t = await ultimaConocida(dd);
    }
  }
  if (!t) {
    if (manual.eur || manual.usd) {
      // Una sola a mano basta si es la que hace falta; la otra queda igual (no se usa para convertir).
      const x = manual.eur ?? (manual.usd as number);
      return { dia: dd, eur: manual.eur ?? x, usd: manual.usd ?? x, fuente: "manual" };
    }
    throw new ErrorCrm(503, "sin_tasa", `No pude conseguir la tasa de cambio del ${dd}. Pásala a mano: tasa_eur (pesos por 1 EUR) y, si el valor está en dólares, tasa_usd.`, "tasa_eur");
  }
  return { ...t, eur: manual.eur ?? t.eur, usd: manual.usd ?? t.usd, fuente: manual.eur || manual.usd ? `${t.fuente} + manual` : t.fuente };
}

/** Pesos por 1 unidad de `m` según `t`. */
export const copPor = (m: Moneda, t: Tasas) => (m === "COP" ? 1 : m === "EUR" ? t.eur : t.usd);
