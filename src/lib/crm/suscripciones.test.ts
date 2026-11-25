import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import type { Actor } from "./actor";
import { borradorDesdeOportunidad, crearContratoCrm } from "./contratos";
import { asegurarEsquema } from "./esquema";
import { crearOportunidad, moverEtapa } from "./oportunidades";
import { crearPersona } from "./personas";
import { listarSuscripciones, suscripcionDesdeGanada } from "./suscripciones";
import { crearUsuario } from "./usuarios";

/**
 * Compuerta de 1c (spec §10): ganar una oportunidad con contrato firmado crea la suscripción.
 *   DB_MAX_CONEXIONES=1 SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/suscripciones.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test("ganar con contrato firmado crea la suscripción; sin firma, no", async () => {
  await asegurarEsquema();
  const { usuario } = await crearUsuario(null, { nombre: "Dueño susc", correo: `dueno-susc+${s}@prueba.dev`, tipo: "humano", rol: "dueno" });
  const dueno: Actor = { usuario, origen: "ui", alcances: null, claveId: null };

  // Control: contrato con una firma pendiente → ganar no crea nada.
  const p1 = await crearPersona(dueno, { nombre: "Sin firma", correo: `sinfirma+${s}@prueba.dev`, empresa: `Pendiente ${s}`, origen: "prueba" });
  const o1 = await crearOportunidad(dueno, { titulo: `Pendiente ${s}`, personaId: p1.id, empresaId: p1.empresa_id, proximoPaso: "Firmar", proximoPasoAt: "2027-02-01", valorArranque: 1_500_000, valorMensual: 150_000 });
  const b1 = await borradorDesdeOportunidad(dueno, o1.id, "2026-11-22");
  const c1 = await crearContratoCrm(dueno, { plantilla: "servinomic", datos: b1.datos, oportunidadId: o1.id });
  await sql`UPDATE contrato_firmantes SET firmado_at = NOW() WHERE contrato_id = ${c1.id} AND rol = 'clienta'`;
  await moverEtapa(dueno, o1.id, { a: "ganado" });
  assert.equal((await listarSuscripciones(dueno, { estado: "todas", empresaId: p1.empresa_id })).length, 0, "sin todas las firmas no nace suscripción");

  // Todas las firmas → ganar crea la suscripción con la mensualidad del contrato.
  const p2 = await crearPersona(dueno, { nombre: "Firmó", correo: `firmo+${s}@prueba.dev`, empresa: `Firmada ${s}`, origen: "prueba" });
  const o2 = await crearOportunidad(dueno, { titulo: `Firmada ${s}`, personaId: p2.id, empresaId: p2.empresa_id, proximoPaso: "Firmar", proximoPasoAt: "2027-02-01", valorArranque: 2_000_000, valorMensual: 180_000 });
  const b2 = await borradorDesdeOportunidad(dueno, o2.id, "2026-11-22");
  const c2 = await crearContratoCrm(dueno, { plantilla: "servinomic", datos: { ...b2.datos, mensualidad: 175_000 }, oportunidadId: o2.id });
  await sql`UPDATE contrato_firmantes SET firmado_at = NOW() WHERE contrato_id = ${c2.id}`;
  await moverEtapa(dueno, o2.id, { a: "ganado" });
  const subs = await listarSuscripciones(dueno, { estado: "todas", empresaId: p2.empresa_id });
  assert.equal(subs.length, 1);
  const sub = subs[0];
  assert.equal(sub.oportunidad_id, o2.id);
  assert.equal(sub.contrato_id, c2.id);
  assert.equal(Number(sub.valor_mensual), 175_000, "manda el contrato, no la oportunidad");
  assert.equal(Number(sub.valor_arranque), 2_000_000);
  assert.equal(sub.moneda, "COP");
  assert.equal(sub.producto, "ServiNomic");
  assert.equal(sub.estado, "activa");

  // Idempotente: repetir no duplica.
  const otra = await suscripcionDesdeGanada(dueno, o2.id);
  assert.equal(otra?.id, sub.id);
  assert.equal((await listarSuscripciones(dueno, { estado: "todas", empresaId: p2.empresa_id })).length, 1);
});
