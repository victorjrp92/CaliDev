import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import type { Correo } from "@/lib/delegar/correos/enviar";
import type { Actor } from "./actor";
import { aprobacionPorId, decidir } from "./aprobaciones";
import { borradorDesdeOportunidad, borrarContratoCrm, contratoCrm, crearContratoCrm, cuotasPara, fechasPara, enviarContrato, listarContratos, usarEnviador } from "./contratos";
import { asegurarEsquema } from "./esquema";
import { crearOportunidad } from "./oportunidades";
import { crearPersona, lineaDeTiempo } from "./personas";
import { crearUsuario } from "./usuarios";

/**
 * Contratos en el CRM (entrega 1b) contra la base local:
 *   SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/contratos.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

let n = 0;
async function actor(tipo: "humano" | "agente", rol: string): Promise<Actor> {
  const { usuario } = await crearUsuario(null, { nombre: `${rol} contratos`, correo: `${rol}-c${++n}+${s}@prueba.dev`, tipo, rol });
  return { usuario, origen: tipo === "humano" ? "ui" : "agente", alcances: null, claveId: null };
}

const codigo = (estado: number, c: string) => (e: unknown) => {
  const x = e as { estado?: number; codigo?: string };
  return x.estado === estado && x.codigo === c;
};

const enviados: Correo[] = [];
usarEnviador(async (c) => {
  enviados.push(c);
  return !c.para.toString().includes("rebota");
});

test("las cuotas suman el arranque y caen en los dos meses siguientes", () => {
  const c = cuotasPara(1_850_000, "2026-11-22");
  assert.deepEqual(c.cuotas.map((x) => x.valor), [950_000, 900_000]);
  assert.equal(c.cuotas[1].cuando, "Entre el 1 y el 5 de enero de 2027");
  assert.equal(c.mensualidadDesde, "enero de 2027");
  assert.equal(cuotasPara(80_000, "2026-03-01").cuotas.length, 1);
  // Noviembre 2026: arranque hasta el 31-dic; 12 meses de enero 2027 a diciembre 2027.
  assert.deepEqual(fechasPara("2026-11-22", 12), { finArranque: "31 de diciembre de 2026", permanenciaDesde: "1 de enero de 2027", permanenciaHasta: "31 de diciembre de 2027" });
  assert.equal(fechasPara("2027-01-10", 12).finArranque, "28 de febrero de 2027");
});

test("contrato desde una oportunidad: borrador, envío por aprobación, borrado", async () => {
  await asegurarEsquema();
  const dueno = await actor("humano", "dueno");
  const karen = await actor("humano", "socia");
  const agente = await actor("agente", "agente");

  const p = await crearPersona(dueno, { nombre: "Clienta Contrato", correo: `clienta+${s}@prueba.dev`, empresa: `Aseo ${s}`, origen: "prueba" });
  const o = await crearOportunidad(dueno, { titulo: `ServiNomic ${s}`, personaId: p.id, empresaId: p.empresa_id, proximoPaso: "Firmar", proximoPasoAt: "2027-02-01", valorArranque: 2_000_000, valorMensual: 180_000 });

  // Compuerta 1: el borrador trae persona, empresa y el precio pactado.
  const b = await borradorDesdeOportunidad(agente, o.id, "2026-11-22");
  assert.equal(b.datos.nombre, "Clienta Contrato");
  assert.equal(b.datos.negocio, `Aseo ${s}`);
  assert.equal(b.datos.arranque, 2_000_000);
  assert.equal(b.datos.mensualidad, 180_000);
  assert.equal(b.datos.cuotas.reduce((t, c) => t + c.valor, 0), 2_000_000);
  assert.equal(b.persona_id, p.id);

  // El agente no crea contratos; el dueño sí, y queda unido a la oportunidad y a la persona.
  await assert.rejects(crearContratoCrm(agente, { plantilla: "servinomic", datos: b.datos, oportunidadId: o.id }), codigo(403, "sin_permiso"));
  const c = await crearContratoCrm(dueno, { plantilla: "servinomic", datos: b.datos, oportunidadId: o.id });
  assert.equal(c.oportunidad_id, o.id);
  assert.equal(c.persona_id, p.id);
  assert.equal(c.estado, "esperando");
  assert.ok(c.firmantes.every((f) => f.enlace), "el dueño ve los enlaces");
  assert.equal((await listarContratos(agente, { oportunidadId: o.id })).length, 1);
  assert.ok((await contratoCrm(agente, c.id)).firmantes.every((f) => !f.enlace), "el agente no ve los enlaces (son secretos)");

  // Compuerta 2: el agente pide el envío → 202 con aprobación pendiente, nada sale todavía.
  const antes = enviados.length;
  const r = await enviarContrato(agente, c.id);
  assert.equal(r.estado, "pendiente");
  if (r.estado !== "pendiente") return;
  assert.equal(enviados.length, antes, "nada sale sin aprobación");
  assert.equal(r.aprobacion.tipo, "enviar_contrato");
  assert.ok(r.aprobacion.vista_previa.includes(`clienta+${s}@prueba.dev`));
  assert.ok(!r.aprobacion.vista_previa.includes("/contratos/"), "la vista previa no filtra el enlace");
  await assert.rejects(decidir(agente, r.aprobacion.id, { decision: "aprobar" }), codigo(403, "sin_permiso"));
  const d = await decidir(karen, r.aprobacion.id, { decision: "aprobar" });
  assert.equal(d.estado, "ejecutada", JSON.stringify(d.resultado));
  assert.equal(enviados.length, antes + 1);
  assert.ok(enviados.at(-1)!.html.includes(c.firmantes[0].enlace!), "el correo lleva el enlace real de la clienta");
  const env = (await contratoCrm(dueno, c.id)).envios;
  assert.equal(env.length, 1);
  assert.ok(env[0].ok);

  // Payload editado a un correo que rebota: la aprobación queda fallida y el intento registrado.
  const r2 = await enviarContrato(agente, c.id);
  if (r2.estado !== "pendiente") return assert.fail("debía quedar pendiente");
  const d2 = await decidir(karen, r2.aprobacion.id, { decision: "aprobar", payload: { ...r2.aprobacion.payload, correo: `rebota+${s}@prueba.dev` } });
  assert.equal(d2.estado, "fallida");
  assert.equal((await aprobacionPorId(r2.aprobacion.id))!.estado, "fallida");
  assert.equal((await contratoCrm(dueno, c.id)).envios.filter((e) => !e.ok).length, 1);

  // Un humano con contrato:enviar lo manda directo.
  const r3 = await enviarContrato(dueno, c.id, { correo: `otra+${s}@prueba.dev` });
  assert.equal(r3.estado, "enviado");
  await assert.rejects(enviarContrato(dueno, c.id, { correo: "no-es-correo" }), codigo(400, "campo_invalido"));

  // La línea de tiempo de la persona muestra el contrato y los envíos.
  const hitos = await lineaDeTiempo(p.id);
  assert.ok(hitos.some((h) => h.titulo === "Contrato creado" && h.entidad_id === String(c.id)));
  assert.equal(hitos.filter((h) => h.titulo === "Enlace de firma enviado").length, 2);

  // Firmado por la clienta: ya no se borra ni se le reenvía.
  await sql`UPDATE contrato_firmantes SET firmado_at = NOW() WHERE contrato_id = ${c.id} AND rol = 'clienta'`;
  await assert.rejects(enviarContrato(dueno, c.id), codigo(409, "sin_pendientes"));
  await assert.rejects(borrarContratoCrm(dueno, c.id), codigo(409, "ya_firmado"));

  // Uno sin firmas sí se borra, con sus enlaces a la persona.
  const c2 = await crearContratoCrm(dueno, { plantilla: "servinomic", datos: b.datos, oportunidadId: o.id });
  await borrarContratoCrm(dueno, c2.id);
  await assert.rejects(contratoCrm(dueno, c2.id), codigo(404, "no_existe"));
  const refs = await sql`SELECT 1 FROM crm_personas_ref WHERE tabla = 'contrato_firmantes' AND ref_id = ANY(${c2.firmantes.map((f) => String(f.id))}::text[])`;
  assert.equal(refs.rows.length, 0);
});

test("la plantilla de pesos no acepta una oportunidad en euros", async () => {
  const dueno = await actor("humano", "dueno");
  const o = await crearOportunidad(dueno, { titulo: `EUR ${s}`, proximoPaso: "Llamar", proximoPasoAt: "2027-02-01", moneda: "EUR" });
  await assert.rejects(borradorDesdeOportunidad(dueno, o.id), codigo(400, "campo_invalido"));
});
