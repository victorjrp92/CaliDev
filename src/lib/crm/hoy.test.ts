import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import { crearCita, reservar } from "@/lib/citas/datos";
import type { Actor } from "./actor";
import { diaColombia, semanaColombia } from "./agenda";
import { asegurarEsquema } from "./esquema";
import { embudo, hoy } from "./hoy";
import { agregarNota } from "./notas";
import { crearOportunidad, moverEtapa } from "./oportunidades";
import { crearPersona, enlazar } from "./personas";
import { crearUsuario } from "./usuarios";

/**
 *   DB_MAX_CONEXIONES=1 SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/hoy.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test("límites de día y semana en hora de Colombia", () => {
  // 03:30 UTC del martes = 22:30 del lunes en Colombia.
  const { dia, desde, hasta } = diaColombia(null, new Date("2026-11-24T03:30:00Z"));
  assert.equal(dia, "2026-11-23");
  assert.equal(desde.toISOString(), "2026-11-23T05:00:00.000Z");
  assert.equal(hasta.toISOString(), "2026-11-24T05:00:00.000Z");
  const sem = semanaColombia(new Date("2026-11-29T23:00:00-05:00")); // domingo noche
  assert.equal(sem.desde.toISOString(), "2026-11-23T05:00:00.000Z", "la semana empieza el lunes");
  assert.equal(sem.hasta.toISOString(), "2026-11-30T05:00:00.000Z");
});

test("Hoy: citas del día con brief, lo vencido, aprobaciones y permisos por bloque", async () => {
  await asegurarEsquema();
  const { usuario } = await crearUsuario(null, { nombre: "Socia hoy", correo: `socia-hoy+${s}@prueba.dev`, tipo: "humano", rol: "socia" });
  const karen: Actor = { usuario, origen: "ui", alcances: null, claveId: null };

  // Un día lejano y único para no chocar con otras corridas (el índice de citas exige inicio único).
  const base = new Date(Date.now() + (4000 + Math.floor(Math.random() * 3000)) * 864e5);
  const dia = base.toISOString().slice(0, 10);
  const hora = 6 + Math.floor(Math.random() * 15);
  const inicio = new Date(`${dia}T${String(hora).padStart(2, "0")}:00:00-05:00`);
  const ahora = new Date(`${dia}T05:30:00-05:00`);

  const p = await crearPersona(karen, { nombre: "Persona hoy", correo: `hoy+${s}@prueba.dev`, origen: "prueba" });
  const cita = await crearCita("Persona hoy", `hoy+${s}@prueba.dev`, []);
  assert.equal((await reservar(cita, inicio)).ok, true);
  await enlazar(p.id, "citas", cita.id);
  await agregarNota(karen, { entidad: "cita", entidadId: cita.id, tipo: "brief", cuerpo: "Qué hace la empresa…" });
  const o = await crearOportunidad(karen, { titulo: "Vencida", personaId: p.id, proximoPaso: "Llamar", proximoPasoAt: new Date(ahora.getTime() - 864e5).toISOString() });

  const h = await hoy(karen, { dia, ahora });
  assert.equal(h.dia, dia);
  const c = h.citas!.find((x) => x.id === cita.id);
  assert.ok(c, "la cita del día aparece");
  assert.equal(c.inicio, inicio.toISOString());
  assert.equal(new Date(c.fin).getTime() - inicio.getTime(), 3600e3);
  assert.equal(c.tiene_brief, true);
  assert.equal(c.persona_id, p.id);
  assert.equal(c.oportunidad_id, o.id);
  assert.ok(h.oportunidades_vencidas!.some((x) => x.id === o.id), "la oportunidad con paso vencido aparece");
  assert.ok(h.aprobaciones && h.aprobaciones.total >= 0);
  assert.ok(h.embudo);

  // Clave limitada a ventas: no ve agenda, tareas ni aprobaciones.
  const limitada = await hoy({ ...karen, alcances: ["ventas:leer"] }, { dia, ahora });
  assert.equal(limitada.citas, null);
  assert.equal(limitada.tareas, null);
  assert.equal(limitada.aprobaciones, null);
  assert.ok(limitada.oportunidades_vencidas);

  // Otro día no trae esa cita.
  const otro = await hoy(karen, { dia: new Date(inicio.getTime() + 2 * 864e5).toISOString().slice(0, 10), ahora });
  assert.ok(!otro.citas!.some((x) => x.id === cita.id));
  const antes = await hoy(karen, { dia: new Date(inicio.getTime() - 2 * 864e5).toISOString().slice(0, 10), ahora });
  assert.ok(!antes.citas!.some((x) => x.id === cita.id), "el día anterior tampoco");
});

test("embudo: un paso a calificado esta semana suma uno", async () => {
  await asegurarEsquema();
  const antes = await embudo();
  const { usuario } = await crearUsuario(null, { nombre: "Dueño emb", correo: `dueno-emb+${s}@prueba.dev`, tipo: "humano", rol: "dueno" });
  const v: Actor = { usuario, origen: "ui", alcances: null, claveId: null };
  const o = await crearOportunidad(v, { titulo: "Embudo", proximoPaso: "Calificar", proximoPasoAt: "2027-03-01" });
  await moverEtapa(v, o.id, { a: "calificado" });
  const despues = await embudo();
  assert.equal(despues.calificados, antes.calificados + 1);
  assert.equal(despues.meta.ingresoMesCop, 20_000_000);
  if (despues.tasa_cierre !== null) assert.ok(despues.meta.diagnosticos_semana_necesarios! > 0);
  await sql`SELECT 1`;
});
