import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { diaColombia } from "./agenda";
import { aCop, aEur } from "./dinero";
import { exigir } from "./guardia";
import { META } from "./hoy";
import { copPor, tasasDelDia } from "./tasas";

/**
 * Resumen de finanzas (spec §4 y §8) y exportación para el contador.
 *
 * - MRR: suma de `valor_mensual` de las suscripciones activas, en pesos con la
 *   tasa de hoy (si no hay tasa, solo suma las de pesos y lo dice).
 * - Ingreso del mes: cobros pagados en el mes calendario de Colombia, con la
 *   tasa guardada del día del pago. No se recalcula nunca.
 * - Margen por cliente: lo cobrado en el mes menos sus gastos imputados.
 */
export type MargenCliente = { empresa_id: number; empresa: string; mrr_cop: number; ingreso_mes_cop: number; gastos_mes_cop: number; margen_cop: number };

export type Resumen = {
  mes: string;
  mrr_cop: number;
  mrr_completo: boolean;
  suscripciones_activas: number;
  ingreso_mes_cop: number;
  ingreso_mes_eur: number;
  cobros_pagados_mes: number;
  por_cobrar_cop: number;
  mora: { cobros: number; total_cop: number };
  gastos_mes_cop: number;
  resultado_mes_cop: number;
  margen: MargenCliente[];
  meta: { ingreso_mes_cop: number; mes: string; avance: number; meses_restantes: number };
};

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Límites UTC del mes calendario de Colombia (UTC−5 todo el año). */
export function limitesMes(mes: string): { desde: string; hasta: string; primerDia: string; ultimoDia: string } {
  const [a, m] = mes.split("-").map(Number);
  const sig = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { desde: `${mes}-01T05:00:00Z`, hasta: `${sig}-01T05:00:00Z`, primerDia: `${mes}-01`, ultimoDia: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

const mesDe = (v: unknown, ahora: Date) => {
  if (v == null || v === "") return diaColombia(null, ahora).dia.slice(0, 7);
  if (typeof v !== "string" || !MES.test(v)) throw new ErrorCrm(400, "campo_invalido", "mes: formato AAAA-MM.", "mes");
  return v;
};

const mesesEntre = (a: string, b: string) => {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
};

export async function resumen(actor: Actor, f: { mes?: unknown } = {}, ahora = new Date()): Promise<Resumen> {
  exigir(actor, "finanzas:leer");
  const mes = mesDe(f.mes, ahora);
  const l = limitesMes(mes);
  const hoy = diaColombia(null, ahora).dia;

  const subs = (await sql<{ empresa_id: number; empresa: string; valor_mensual: string; moneda: "COP" | "EUR" | "USD" }>`
    SELECT s.empresa_id, e.nombre AS empresa, s.valor_mensual, s.moneda
    FROM crm_suscripciones s JOIN crm_empresas e ON e.id = s.empresa_id WHERE s.estado = 'activa'`).rows;
  let tasas: Awaited<ReturnType<typeof tasasDelDia>> | null = null;
  if (subs.some((s) => s.moneda !== "COP")) tasas = await tasasDelDia(hoy, {}, ahora).catch(() => null);
  const mrrDe = (s: (typeof subs)[number]) => (s.moneda === "COP" ? Number(s.valor_mensual) : tasas ? aCop(s.valor_mensual, copPor(s.moneda, tasas)) : 0);

  const pagados = (await sql<{ empresa_id: number; empresa: string; valor: string; tasa_cop: string; tasa_eur: string }>`
    SELECT c.empresa_id, e.nombre AS empresa, c.valor, c.tasa_cop, c.tasa_eur
    FROM crm_cobros c JOIN crm_empresas e ON e.id = c.empresa_id
    WHERE c.estado = 'pagado' AND c.pagado_at >= ${l.desde} AND c.pagado_at < ${l.hasta}`).rows;
  const pendientes = (await sql<{ valor: string; tasa_cop: string; vencido: boolean }>`
    SELECT valor, tasa_cop, vence_at < ${hoy}::date AS vencido FROM crm_cobros WHERE estado = 'pendiente'`).rows;
  const gastos = (await sql<{ empresa_id: number | null; empresa: string | null; valor: string; tasa_cop: string }>`
    SELECT g.empresa_id, e.nombre AS empresa, g.valor, g.tasa_cop
    FROM crm_gastos g LEFT JOIN crm_empresas e ON e.id = g.empresa_id
    WHERE g.fecha >= ${l.primerDia}::date AND g.fecha <= ${l.ultimoDia}::date`).rows;

  const suma = (xs: number[]) => Math.round(xs.reduce((t, x) => t + x, 0) * 100) / 100;
  const ingresoCop = suma(pagados.map((c) => aCop(c.valor, c.tasa_cop)));
  const gastosCop = suma(gastos.map((g) => aCop(g.valor, g.tasa_cop)));
  const mora = pendientes.filter((c) => c.vencido);

  const margen = new Map<number, MargenCliente>();
  const fila = (id: number, nombre: string) => {
    let m = margen.get(id);
    if (!m) margen.set(id, (m = { empresa_id: id, empresa: nombre, mrr_cop: 0, ingreso_mes_cop: 0, gastos_mes_cop: 0, margen_cop: 0 }));
    return m;
  };
  for (const s of subs) fila(s.empresa_id, s.empresa).mrr_cop += mrrDe(s);
  for (const c of pagados) fila(c.empresa_id, c.empresa).ingreso_mes_cop += aCop(c.valor, c.tasa_cop);
  for (const g of gastos) if (g.empresa_id !== null) fila(g.empresa_id, g.empresa ?? "").gastos_mes_cop += aCop(g.valor, g.tasa_cop);
  for (const m of margen.values()) {
    for (const k of ["mrr_cop", "ingreso_mes_cop", "gastos_mes_cop"] as const) m[k] = Math.round(m[k] * 100) / 100;
    m.margen_cop = Math.round((m.ingreso_mes_cop - m.gastos_mes_cop) * 100) / 100;
  }

  return {
    mes,
    mrr_cop: suma(subs.map(mrrDe)),
    mrr_completo: !subs.some((s) => s.moneda !== "COP") || tasas !== null,
    suscripciones_activas: subs.length,
    ingreso_mes_cop: ingresoCop,
    ingreso_mes_eur: suma(pagados.map((c) => aEur(c.valor, c.tasa_cop, c.tasa_eur))),
    cobros_pagados_mes: pagados.length,
    por_cobrar_cop: suma(pendientes.map((c) => aCop(c.valor, c.tasa_cop))),
    mora: { cobros: mora.length, total_cop: suma(mora.map((c) => aCop(c.valor, c.tasa_cop))) },
    gastos_mes_cop: gastosCop,
    resultado_mes_cop: Math.round((ingresoCop - gastosCop) * 100) / 100,
    margen: [...margen.values()].sort((a, b) => b.margen_cop - a.margen_cop || b.mrr_cop - a.mrr_cop),
    meta: {
      ingreso_mes_cop: META.ingresoMesCop,
      mes: META.mes,
      avance: Math.round((ingresoCop / META.ingresoMesCop) * 1000) / 1000,
      meses_restantes: Math.max(0, mesesEntre(diaColombia(null, ahora).dia.slice(0, 7), META.mes)),
    },
  };
}

/* ---------- Exportación para el contador ---------- */

const COLUMNAS = ["tipo", "fecha", "empresa", "concepto", "descripcion", "moneda", "valor", "tasa_cop", "valor_cop", "tasa_eur", "valor_eur", "metodo", "recibo"] as const;

/** Número con coma decimal y sin separador de miles (lo que abre bien un Excel en español). */
const num = (v: number | string, dec = 2) => Number(v).toFixed(dec).replace(".", ",");
const celda = (v: string | null) => {
  const t = v ?? "";
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/**
 * CSV de un rango de días (por defecto el mes en curso): cobros pagados por
 * fecha de pago y gastos por su fecha. `;` como separador, coma decimal y BOM
 * UTF-8 para que Excel lo abra con tildes.
 */
export async function exportarCsv(actor: Actor, f: { mes?: unknown } = {}, ahora = new Date()): Promise<{ nombre: string; csv: string }> {
  exigir(actor, "finanzas:leer");
  const mes = mesDe(f.mes, ahora);
  const l = limitesMes(mes);
  const cobros = (await sql<{ fecha: string; empresa: string; concepto: string; descripcion: string | null; moneda: string; valor: string; tasa_cop: string; tasa_eur: string; metodo: string; recibo: string | null }>`
    SELECT to_char(c.pagado_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS fecha, e.nombre AS empresa, c.concepto, c.descripcion,
      c.moneda, c.valor, c.tasa_cop, c.tasa_eur, c.metodo, p.receipt_number AS recibo
    FROM crm_cobros c JOIN crm_empresas e ON e.id = c.empresa_id LEFT JOIN payment_links p ON p.id = c.payment_link_id
    WHERE c.estado = 'pagado' AND c.pagado_at >= ${l.desde} AND c.pagado_at < ${l.hasta}
    ORDER BY c.pagado_at, c.id`.catch(async (e) => {
      // Sin la tabla payment_links (base nueva) se exporta sin número de recibo.
      if ((e as { code?: string }).code !== "42P01") throw e;
      return sql<{ fecha: string; empresa: string; concepto: string; descripcion: string | null; moneda: string; valor: string; tasa_cop: string; tasa_eur: string; metodo: string; recibo: string | null }>`
        SELECT to_char(c.pagado_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS fecha, e.nombre AS empresa, c.concepto, c.descripcion,
          c.moneda, c.valor, c.tasa_cop, c.tasa_eur, c.metodo, NULL::text AS recibo
        FROM crm_cobros c JOIN crm_empresas e ON e.id = c.empresa_id
        WHERE c.estado = 'pagado' AND c.pagado_at >= ${l.desde} AND c.pagado_at < ${l.hasta}
        ORDER BY c.pagado_at, c.id`;
    })).rows;
  const gastos = (await sql<{ fecha: string; empresa: string | null; proveedor: string; concepto: string; moneda: string; valor: string; tasa_cop: string; tasa_eur: string }>`
    SELECT g.fecha::text AS fecha, e.nombre AS empresa, g.proveedor, g.concepto, g.moneda, g.valor, g.tasa_cop, g.tasa_eur
    FROM crm_gastos g LEFT JOIN crm_empresas e ON e.id = g.empresa_id
    WHERE g.fecha >= ${l.primerDia}::date AND g.fecha <= ${l.ultimoDia}::date ORDER BY g.fecha, g.id`).rows;

  const lineas = [COLUMNAS.join(";")];
  for (const c of cobros) {
    lineas.push([
      "ingreso", c.fecha, celda(c.empresa), c.concepto, celda(c.descripcion), c.moneda, num(c.valor), num(c.tasa_cop, 4),
      num(aCop(c.valor, c.tasa_cop)), num(c.tasa_eur, 4), num(aEur(c.valor, c.tasa_cop, c.tasa_eur)), c.metodo, celda(c.recibo),
    ].join(";"));
  }
  for (const g of gastos) {
    lineas.push([
      "gasto", g.fecha, celda(g.empresa), celda(g.proveedor), celda(g.concepto), g.moneda, num(g.valor), num(g.tasa_cop, 4),
      num(aCop(g.valor, g.tasa_cop)), num(g.tasa_eur, 4), num(aEur(g.valor, g.tasa_cop, g.tasa_eur)), "", "",
    ].join(";"));
  }
  return { nombre: `calidev-finanzas-${mes}.csv`, csv: `﻿${lineas.join("\r\n")}\r\n` };
}
