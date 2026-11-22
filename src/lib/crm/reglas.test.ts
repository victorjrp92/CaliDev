import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import type { Actor } from "./actor";
import { decidir, solicitar } from "./aprobaciones";
import { asegurarEsquema } from "./esquema";
import { crearOportunidad, moverEtapa } from "./oportunidades";
import { crearPersona } from "./personas";
import { crearUsuario } from "./usuarios";

/**
 * Reglas de negocio de la entrega 1a contra la base local: lo que un agente no
 * puede hacer, el próximo paso obligatorio y las carreras.
 *   SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/reglas.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function actor(tipo: "humano" | "agente", rol: string): Promise<Actor> {
  const { usuario } = await crearUsuario(null, { nombre: `${rol} prueba`, correo: `${rol}+${s}@prueba.dev`, tipo, rol });
  return { usuario, origen: tipo === "humano" ? "ui" : "agente", alcances: null, claveId: null };
}

const codigo = (estado: number, c: string) => (e: unknown) => {
  const x = e as { estado?: number; codigo?: string };
  return x.estado === estado && x.codigo === c;
};

test("reglas de oportunidades y aprobaciones", async () => {
  await asegurarEsquema();
  const agente = await actor("agente", "agente");
  const karen = await actor("humano", "socia");
  const p = await crearPersona(agente, { nombre: "Persona reglas", origen: "prueba" });

  // Sin próximo paso no hay oportunidad abierta.
  await assert.rejects(crearOportunidad(agente, { titulo: "Sin paso", personaId: p.id }), codigo(400, "regla_etapa"));
  const o = await crearOportunidad(agente, { titulo: "Reglas", personaId: p.id, proximoPaso: "Llamar", proximoPasoAt: "2027-02-01" });

  // El agente prepara pero no cierra; Karen sí.
  await assert.rejects(moverEtapa(agente, o.id, { a: "ganado" }), codigo(403, "sin_permiso"));
  await assert.rejects(moverEtapa(karen, o.id, { a: "perdido" }), codigo(400, "regla_etapa"), "perdido sin motivo");

  // Dos movimientos a la vez: el historial nunca miente (cada fila parte de donde quedó la anterior).
  const r = await Promise.allSettled([
    moverEtapa(karen, o.id, { a: "diagnostico_agendado", proximoPasoAt: "2027-02-02" }),
    moverEtapa(agente, o.id, { a: "propuesta", proximoPasoAt: "2027-02-03" }),
  ]);
  for (const x of r) if (x.status === "rejected") assert.ok(codigo(409, "cambio_concurrente")(x.reason), String(x.reason));
  const h = (await sql<{ de: string | null; a: string }>`SELECT de, a FROM crm_etapas_historial WHERE oportunidad_id = ${o.id} ORDER BY id`).rows;
  for (let i = 1; i < h.length; i++) assert.equal(h[i].de, h[i - 1].a, `historial roto: ${JSON.stringify(h)}`);
  await moverEtapa(karen, o.id, { a: "ganado" });

  // Aprobaciones: el agente pide, no decide; dos decisiones = una sola.
  const ap = await solicitar(agente, { tipo: "enviar_mensaje", payload: { texto: "Hola" }, vistaPrevia: "Hola", entidad: "oportunidad", entidadId: o.id });
  assert.equal(ap.estado, "pendiente");
  await assert.rejects(decidir(agente, ap.id, { decision: "aprobar" }), codigo(403, "sin_permiso"));
  await assert.rejects(decidir(karen, ap.id, { decision: "rechazar" }), codigo(400, "campo_requerido"), "rechazar pide motivo");
  const d = await Promise.allSettled([decidir(karen, ap.id, { decision: "aprobar" }), decidir(karen, ap.id, { decision: "aprobar" })]);
  assert.equal(d.filter((x) => x.status === "fulfilled").length, 1);
  assert.ok(d.some((x) => x.status === "rejected" && codigo(409, "ya_decidida")(x.reason)));

  // Cada escritura quedó auditada.
  const aud = (await sql<{ accion: string }>`SELECT accion FROM crm_auditoria WHERE entidad = 'aprobacion' AND entidad_id = ${String(ap.id)} ORDER BY id`).rows;
  assert.deepEqual(aud.map((x) => x.accion), ["solicitar", "aprobar"]);
});
