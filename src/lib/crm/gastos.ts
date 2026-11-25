import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { diaColombia } from "./agenda";
import { auditar } from "./auditoria";
import { aCop, dia, type Moneda, moneda, monto } from "./dinero";
import { exigir } from "./guardia";
import { copPor, tasasDelDia } from "./tasas";

/**
 * Gastos (spec §4): proveedor, concepto y valor, con la tasa de su fecha.
 * `empresa_id` opcional imputa el gasto a un cliente para el margen.
 */
export type Gasto = {
  id: number;
  fecha: string;
  proveedor: string;
  concepto: string;
  valor: string;
  moneda: Moneda;
  tasa_eur: string;
  tasa_cop: string;
  empresa_id: number | null;
  empresa: string | null;
  recurrente: boolean;
  creado_por: number | null;
  created_at: string;
  valor_cop: number;
};

async function filas(f: { id?: number; desde?: string | null; hasta?: string | null; empresaId?: number | null }): Promise<Gasto[]> {
  const r = await sql<Omit<Gasto, "valor_cop">>`
    SELECT g.id, g.fecha::text AS fecha, g.proveedor, g.concepto, g.valor, g.moneda, g.tasa_eur, g.tasa_cop, g.empresa_id,
      e.nombre AS empresa, g.recurrente, g.creado_por, g.created_at
    FROM crm_gastos g LEFT JOIN crm_empresas e ON e.id = g.empresa_id
    WHERE (${f.id ?? null}::int IS NULL OR g.id = ${f.id ?? null})
      AND (${f.desde ?? null}::date IS NULL OR g.fecha >= ${f.desde ?? null}::date)
      AND (${f.hasta ?? null}::date IS NULL OR g.fecha <= ${f.hasta ?? null}::date)
      AND (${f.empresaId ?? null}::int IS NULL OR g.empresa_id = ${f.empresaId ?? null})
    ORDER BY g.fecha DESC, g.id DESC LIMIT 1000`;
  return r.rows.map((g) => ({ ...g, valor_cop: aCop(g.valor, g.tasa_cop) }));
}

export async function listarGastos(actor: Actor, f: { desde?: unknown; hasta?: unknown; empresaId?: number | null } = {}): Promise<Gasto[]> {
  exigir(actor, "finanzas:leer");
  return filas({ desde: dia(f.desde, "desde"), hasta: dia(f.hasta, "hasta"), empresaId: f.empresaId });
}

const txt = (v: unknown, campo: string, max = 200): string => {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) throw new ErrorCrm(400, "campo_requerido", `Falta ${campo}.`, campo);
  return t.slice(0, max);
};

export async function crearGasto(actor: Actor, d: Record<string, unknown>, ahora = new Date()): Promise<Gasto> {
  exigir(actor, "finanzas:escribir");
  const fecha = dia(d.fecha, "fecha") ?? diaColombia(null, ahora).dia;
  if (fecha > diaColombia(null, ahora).dia) throw new ErrorCrm(400, "campo_invalido", "fecha: un gasto no puede ser futuro.", "fecha");
  const proveedor = txt(d.proveedor, "proveedor");
  const concepto = txt(d.concepto, "concepto", 300);
  const valor = monto(d.valor, "valor", { requerido: true, positivo: true })!;
  const m = moneda(d.moneda ?? "COP");
  const empresaId = d.empresa_id == null || d.empresa_id === "" ? null : Number(d.empresa_id);
  if (empresaId !== null && !(await sql`SELECT 1 FROM crm_empresas WHERE id = ${empresaId}`).rows[0]) throw new ErrorCrm(404, "no_existe", `No hay empresa ${empresaId}.`, "empresa_id");
  if ("recurrente" in d && typeof d.recurrente !== "boolean") throw new ErrorCrm(400, "campo_invalido", "recurrente: true o false.", "recurrente");
  const t = await tasasDelDia(fecha, { eur: monto(d.tasa_eur, "tasa_eur", { positivo: true }), usd: monto(d.tasa_usd, "tasa_usd", { positivo: true }) }, ahora);
  const r = await sql<{ id: number }>`
    INSERT INTO crm_gastos (fecha, proveedor, concepto, valor, moneda, tasa_eur, tasa_cop, empresa_id, recurrente, creado_por)
    VALUES (${fecha}, ${proveedor}, ${concepto}, ${valor}, ${m}, ${t.eur}, ${copPor(m, t)}, ${empresaId}, ${d.recurrente === true}, ${actor.usuario.id})
    RETURNING id`;
  const g = (await filas({ id: r.rows[0].id }))[0];
  await auditar(actor, "crear", "gasto", g.id, null, { ...g, fuente_tasa: t.fuente });
  return g;
}

export async function borrarGasto(actor: Actor, id: number): Promise<void> {
  exigir(actor, "finanzas:escribir");
  const g = (await filas({ id }))[0];
  if (!g) throw new ErrorCrm(404, "no_existe", `No hay gasto ${id}.`);
  await sql`DELETE FROM crm_gastos WHERE id = ${id}`;
  await auditar(actor, "borrar", "gasto", id, g, null);
}
