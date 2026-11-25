import type { Cobro } from "@/lib/crm/cobros";

/** Listas para los formularios de cliente: el módulo de cobros trae la base y no puede ir al navegador. */
export const METODOS = ["transferencia", "efectivo", "stripe"] as const;
export const NOMBRE_METODO: Record<Cobro["metodo"], string> = { transferencia: "Transferencia", efectivo: "Efectivo", stripe: "Stripe" };

export const CONCEPTOS = ["arranque", "cuota", "mensualidad", "otro"] as const;
export const NOMBRE_CONCEPTO: Record<Cobro["concepto"], string> = { arranque: "Arranque", cuota: "Cuota", mensualidad: "Mensualidad", otro: "Otro" };

/** Valor escrito en un campo → número, o null si no es un número positivo. Sin puntos de miles. */
export function numeroDe(t: string): number | null {
  const n = Number(t.trim().replace(",", "."));
  return t.trim() && Number.isFinite(n) && n > 0 ? n : null;
}
