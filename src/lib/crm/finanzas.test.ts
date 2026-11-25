import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import type { Actor } from "./actor";
import { decidir } from "./aprobaciones";
import { altaCliente } from "./clientes";
import { anularCobro, cobroPorId, crearCobro, marcarPagadoPorLink, registrarPago } from "./cobros";
import { borradorDesdeOportunidad, crearContratoCrm } from "./contratos";
import { asegurarEsquema } from "./esquema";
import { exportarCsv, resumen } from "./finanzas";
import { borrarGasto, crearGasto } from "./gastos";
import { hoy } from "./hoy";
import { crearOportunidad, moverEtapa } from "./oportunidades";
import { crearPersona } from "./personas";
import { crearSuscripcion, listarSuscripciones } from "./suscripciones";
import { usarProveedorTasas } from "./tasas";
import { crearUsuario } from "./usuarios";

/**
 * Finanzas y productos (entrega 1c, spec §10) contra la base local:
 *   SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/finanzas.test.ts
 *
 * La tasa sale de un proveedor falso y determinista (4000 + día del mes por
 * EUR, 3500 + día por USD) sobre marzo de 2031, un mes que nadie más toca.
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const tasaEur = (d: string) => 4000 + Number(d.slice(8, 10));
const tasaUsd = (d: string) => 3500 + Number(d.slice(8, 10));
usarProveedorTasas(async (d) => ({ eur: tasaEur(d), usd: tasaUsd(d), fuente: "prueba" }));
const AHORA = new Date("2031-03-10T15:00:00Z");

let n = 0;
async function actor(tipo: "humano" | "agente", rol: string): Promise<Actor> {
  const { usuario } = await crearUsuario(null, { nombre: `${rol} finanzas`, correo: `${rol}-f${++n}+${s}@prueba.dev`, tipo, rol });
  return { usuario, origen: tipo === "humano" ? "ui" : "agente", alcances: null, claveId: null };
}

const codigo = (estado: number, c: string) => (e: unknown) => {
  const x = e as { estado?: number; codigo?: string };
  return x.estado === estado && x.codigo === c;
};

test("finanzas: MRR, tasas, mora en Hoy, aprobación de agentes y suscripción al ganar", async () => {
  await asegurarEsquema();
  const dueno = await actor("humano", "dueno");
  const agente = await actor("agente", "agente");
  const servinomic = (await sql<{ id: number }>`SELECT id FROM crm_productos WHERE lower(nombre) = 'servinomic'`).rows[0].id;
  const p = await crearPersona(dueno, { nombre: "Clienta Finanzas", correo: `fin+${s}@prueba.dev`, empresa: `Aseo Fin ${s}`, origen: "prueba" });

  // Compuerta 1: el MRR es la suma a mano de las suscripciones activas.
  const antes = await resumen(dueno, {}, AHORA);
  await crearSuscripcion(dueno, { empresaId: p.empresa_id!, personaId: p.id, productoId: servinomic, valorMensual: 250_000, moneda: "COP" });
  await crearSuscripcion(dueno, { empresaId: p.empresa_id!, personaId: p.id, productoId: servinomic, valorMensual: 100, moneda: "EUR" });
  const despues = await resumen(dueno, {}, AHORA);
  assert.equal(Math.round((despues.mrr_cop - antes.mrr_cop) * 100) / 100, 250_000 + 100 * tasaEur("2031-03-10"));
  const manual = (await sql<{ valor_mensual: string; moneda: string }>`SELECT valor_mensual, moneda FROM crm_suscripciones WHERE estado = 'activa'`).rows
    .reduce((t, x) => t + Number(x.valor_mensual) * (x.moneda === "COP" ? 1 : x.moneda === "EUR" ? tasaEur("2031-03-10") : tasaUsd("2031-03-10")), 0);
  assert.equal(despues.mrr_cop, Math.round(manual * 100) / 100);
  assert.ok(despues.mrr_completo);

  // Compuerta 2: un cobro en EUR guarda la tasa de su día; al pagarse, la del día del pago.
  const eur = await crearCobro(dueno, { personaId: p.id, concepto: "mensualidad", valor: "180", moneda: "EUR", venceAt: "2031-03-20", descripcion: "Mensualidad marzo" }, AHORA);
  if (eur.estado !== "creado") return assert.fail("el dueño crea directo");
  assert.equal(eur.cobro.metodo, "stripe");
  assert.equal(Number(eur.cobro.tasa_eur), tasaEur("2031-03-10"));
  assert.equal(Number(eur.cobro.tasa_cop), tasaEur("2031-03-10"));
  assert.ok(eur.cobro.enlace_pago?.includes(`/pay/${eur.cobro.payment_link_id}`));
  const pagadoEl = new Date("2031-03-12T16:00:00Z");
  assert.equal(await marcarPagadoPorLink(eur.cobro.payment_link_id!, pagadoEl), eur.cobro.id);
  assert.equal(await marcarPagadoPorLink(eur.cobro.payment_link_id!, pagadoEl), null, "el webhook repetido no lo cobra dos veces");
  const pagado = await cobroPorId(dueno, eur.cobro.id, AHORA);
  assert.equal(pagado.estado, "pagado");
  assert.equal(Number(pagado.tasa_eur), tasaEur("2031-03-12"));

  // COP a mano: pagado en un día pasado toma la tasa de ese día. Stripe no cobra pesos.
  await assert.rejects(crearCobro(dueno, { personaId: p.id, valor: 1000, moneda: "COP", venceAt: "2031-03-20", metodo: "stripe", descripcion: "x" }, AHORA), codigo(400, "campo_invalido"));
  const cop = await crearCobro(dueno, { personaId: p.id, concepto: "cuota", valor: "950.000", moneda: "COP", venceAt: "2031-03-05" }, AHORA);
  if (cop.estado !== "creado") return assert.fail();
  assert.equal(Number(cop.cobro.valor), 950_000);

  // Compuerta 3: el cobro vencido aparece en Hoy como mora.
  const h = await hoy(dueno, { ahora: AHORA });
  const enHoy = h.finanzas?.cobros_vencen.find((c) => c.id === cop.cobro.id);
  assert.ok(enHoy, "el cobro vencido sale en Hoy");
  assert.ok(enHoy.mora);
  assert.equal(enHoy.dias_mora, 5);
  assert.ok(h.finanzas!.mora_total_cop >= 950_000);
  assert.equal((await hoy(await actor("agente", "sistema"), { ahora: AHORA })).finanzas, null, "sin finanzas:leer no hay bloque de plata");

  // Ingreso del mes: cuenta lo pagado en marzo con la tasa guardada.
  const ingresoAntes = (await resumen(dueno, { mes: "2031-03" }, AHORA)).ingreso_mes_cop;
  const pagoCop = await registrarPago(dueno, cop.cobro.id, { pagadoAt: "2031-03-08" }, AHORA);
  assert.equal(Number(pagoCop.tasa_eur), tasaEur("2031-03-08"));
  await assert.rejects(registrarPago(dueno, cop.cobro.id, {}, AHORA), codigo(409, "no_pendiente"));
  const r = await resumen(dueno, { mes: "2031-03" }, AHORA);
  assert.equal(r.ingreso_mes_cop, ingresoAntes + 950_000);
  assert.equal(r.meta.ingreso_mes_cop, 20_000_000);

  // Compuerta 4: el agente que crea un cobro termina en Aprobaciones; al aprobar, existe.
  const pedido = await crearCobro(agente, { personaId: p.id, concepto: "otro", valor: 50_000, moneda: "COP", venceAt: "2031-04-01", tasaEur: 4321, tasaUsd: 3999 }, AHORA);
  if (pedido.estado !== "pendiente") return assert.fail("el agente no crea cobros");
  assert.equal(pedido.aprobacion.tipo, "crear_cobro");
  assert.ok(pedido.aprobacion.vista_previa.includes(`Aseo Fin ${s}`));
  assert.equal((await sql`SELECT 1 FROM crm_cobros WHERE empresa_id = ${p.empresa_id} AND valor = 50000`).rows.length, 0, "nada se crea sin aprobación");
  const d = await decidir(dueno, pedido.aprobacion.id, { decision: "aprobar" });
  assert.equal(d.estado, "ejecutada", JSON.stringify(d.resultado));
  const creado = await cobroPorId(dueno, Number((d.resultado as { cobro_id: number }).cobro_id), AHORA);
  assert.equal(Number(creado.valor), 50_000);
  assert.equal(Number(creado.tasa_eur), 4321);
  await anularCobro(dueno, creado.id, "prueba", AHORA);

  // Compuerta 5: ganar con contrato firmado crea la suscripción; sin contrato, no.
  const o = await crearOportunidad(dueno, { titulo: `Ganada ${s}`, personaId: p.id, empresaId: p.empresa_id, proximoPaso: "Firmar", proximoPasoAt: "2031-04-01", valorArranque: 2_000_000, valorMensual: 180_000 });
  const b = await borradorDesdeOportunidad(dueno, o.id, "2026-11-22");
  const k = await crearContratoCrm(dueno, { plantilla: "servinomic", datos: b.datos, oportunidadId: o.id });
  await sql`UPDATE contrato_firmantes SET firmado_at = NOW() WHERE contrato_id = ${k.id}`;
  await moverEtapa(dueno, o.id, { a: "ganado" });
  const nacida = (await listarSuscripciones(dueno, { empresaId: p.empresa_id })).find((x) => x.oportunidad_id === o.id);
  assert.ok(nacida, "la suscripción nace al ganar");
  assert.equal(Number(nacida.valor_mensual), 180_000);
  assert.equal(nacida.moneda, "COP");
  assert.equal(nacida.contrato_id, k.id);
  const sin = await crearOportunidad(dueno, { titulo: `Sin contrato ${s}`, personaId: p.id, empresaId: p.empresa_id, proximoPaso: "x", proximoPasoAt: "2031-04-01", valorMensual: 1 });
  await moverEtapa(dueno, sin.id, { a: "ganado" });
  assert.equal((await sql`SELECT 1 FROM crm_suscripciones WHERE oportunidad_id = ${sin.id}`).rows.length, 0);
});

test("alta de cliente: precio publicado, promo y cobros en un paso", async () => {
  const dueno = await actor("humano", "dueno");
  const agente = await actor("agente", "agente");
  const datos = {
    empresa: `Alta ${s}`, nit: "900123456-1", contacto: { nombre: "Gerente Alta", correo: `alta+${s}@prueba.dev` }, promo: "captura",
    cobros: [{ concepto: "cuota", valor: 1_000_000, vence: "2031-03-15" }, { concepto: "cuota", valor: 1_125_000, vence: "2031-04-05" }],
  };
  await assert.rejects(altaCliente(agente, datos, AHORA), codigo(403, "sin_permiso"));
  await assert.rejects(altaCliente(dueno, { ...datos, cobros: [{ valor: 0, vence: "2031-03-15" }] }, AHORA), codigo(400, "campo_invalido"));
  assert.equal((await sql`SELECT 1 FROM crm_empresas WHERE nombre = ${`Alta ${s}`}`).rows.length, 0, "si algo no valida, no crea nada");

  const a = await altaCliente(dueno, datos, AHORA);
  const arranque = (await sql<{ valor: string }>`SELECT valor FROM crm_precios p JOIN crm_productos x ON x.id = p.producto_id
    WHERE lower(x.nombre) = 'servinomic' AND p.concepto = 'arranque' AND p.vigente_hasta IS NULL`).rows[0];
  assert.equal(Number(a.suscripcion.valor_arranque), Math.round(Number(arranque.valor) * 0.85), "15 % de la promo sobre el arranque");
  assert.equal(a.promo, "captura");
  assert.equal(a.cobros.length, 2);
  assert.ok(a.cobros.every((c) => c.suscripcion_id === a.suscripcion.id && c.metodo === "transferencia"));
  assert.equal((await sql<{ nit: string }>`SELECT nit FROM crm_empresas WHERE id = ${a.suscripcion.empresa_id}`).rows[0].nit, "900123456-1");
});

test("gastos y CSV para el contador", async () => {
  const dueno = await actor("humano", "dueno");
  const g = await crearGasto(dueno, { fecha: "2031-03-04", proveedor: "Vercel; Inc", concepto: "Hosting \"pro\"", valor: "20", moneda: "USD" }, AHORA);
  assert.equal(Number(g.tasa_cop), tasaUsd("2031-03-04"));
  await assert.rejects(crearGasto(dueno, { fecha: "2031-03-11", proveedor: "x", concepto: "x", valor: 1 }, AHORA), codigo(400, "campo_invalido"));
  const { csv, nombre } = await exportarCsv(dueno, { mes: "2031-03" }, AHORA);
  assert.equal(nombre, "calidev-finanzas-2031-03.csv");
  assert.ok(csv.startsWith("﻿tipo;fecha;empresa;concepto;descripcion;moneda;valor;tasa_cop;valor_cop;tasa_eur;valor_eur;metodo;recibo\r\n"));
  const fila = csv.split("\r\n").find((l) => l.includes("Vercel"));
  assert.equal(fila, `gasto;2031-03-04;;"Vercel; Inc";"Hosting ""pro""";USD;20,00;${tasaUsd("2031-03-04")},0000;${(20 * tasaUsd("2031-03-04")).toFixed(2).replace(".", ",")};${tasaEur("2031-03-04")},0000;${((20 * tasaUsd("2031-03-04")) / tasaEur("2031-03-04")).toFixed(2).replace(".", ",")};;`);
  assert.ok(csv.split("\r\n").some((l) => l.startsWith("ingreso;2031-03-12;")), "el pago por Stripe del 12 sale como ingreso");
  await borrarGasto(dueno, g.id);
  assert.ok(!(await exportarCsv(dueno, { mes: "2031-03" }, AHORA)).csv.includes("Vercel"));
});
