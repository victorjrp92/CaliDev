import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import { crearCita, reservar } from "@/lib/citas/datos";
import { guardarContacto } from "@/lib/contacto/datos";
import { guardarEtapa } from "@/lib/seguimiento/datos";
import type { Actor } from "./actor";
import { asegurarEsquema } from "./esquema";
import { moverEtapa, oportunidadPorId } from "./oportunidades";
import { sincronizar, sincronizarSiToca } from "./sincronizar";
import { crearUsuario } from "./usuarios";

/**
 * Backfill contra una base real (PGlite local), compuerta de la entrega 1a:
 * «el backfill corre dos veces sin crear duplicados».
 *   SUPABASE_DB_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres \
 *   CRM_JWT_SECRET=<32+> npx tsx --test src/lib/crm/sincronizar.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const correo = (n: string) => `${n}+${s}@prueba.dev`;

async function tablaLeads() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY, campaign TEXT NOT NULL DEFAULT 'directo', name TEXT NOT NULL, company TEXT,
      whatsapp TEXT NOT NULL, email TEXT, role TEXT, staff TEXT, urgency TEXT, completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
  for (const c of ["variante", "prioridad", "prioridad_motivo", "actividad", "dolor", "dolor_otro", "herramientas", "busca", "plazo", "freno", "repetitivo"]) {
    await sql.call(null, Object.assign([`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${c} TEXT`], { raw: [`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${c} TEXT`] }) as unknown as TemplateStringsArray);
  }
}

const lead = (nombre: string, email: string | null, whatsapp: string, empresa: string | null = null) =>
  sql<{ id: number }>`INSERT INTO leads (name, email, whatsapp, company) VALUES (${nombre}, ${email}, ${whatsapp}, ${empresa}) RETURNING id`;

/** Una hora futura en punto, entre 6 y 20 de Colombia, distinta en cada corrida (el índice de citas la exige única). */
function horaFutura(): Date {
  const dias = 400 + Math.floor(Math.random() * 3000);
  const hora = 6 + Math.floor(Math.random() * 15);
  const d = new Date(Date.now() + dias * 864e5);
  return new Date(`${d.toISOString().slice(0, 10)}T${String(hora).padStart(2, "0")}:00:00-05:00`);
}

const oportunidadDe = async (clave: string) =>
  (await sql<{ id: number; etapa: string; proximo_paso_at: Date | null; motivo_perdida: string | null; persona_id: number }>`
    SELECT id, etapa, proximo_paso_at, motivo_perdida, persona_id FROM crm_oportunidades WHERE clave_legado = ${clave}`).rows;

test("el backfill corre dos veces sin duplicar y solo avanza", async () => {
  await asegurarEsquema();
  await tablaLeads();

  // A: formulario + 1.ª cita reservada en el futuro → diagnóstico agendado.
  await lead("Ana Prueba", correo("ana"), `57311${s.slice(-7)}`, "Panadería Ana");
  const citaA = await crearCita("Ana Prueba", correo("ana"), []);
  const inicioA = horaFutura();
  assert.equal((await reservar(citaA, inicioA)).ok, true);
  // B: solo WhatsApp, sin correo → lead.
  const wa = `57300${s.slice(-7)}`;
  await lead("Beto Prueba", null, wa);
  // C: perdido en el panel viejo, con su nota → perdido con motivo.
  await lead("Caro Prueba", correo("caro"), `57312${s.slice(-7)}`);
  await guardarEtapa(correo("caro"), "perdido");
  // D: escribió por el formulario de contacto con el mismo correo que A → misma persona, no otra.
  await guardarContacto({ nombre: "Ana P.", correo: correo("ana").toUpperCase(), mensaje: "hola", pagina: null });

  const r1 = await sincronizar(null);
  assert.deepEqual(r1.errores, []);
  const r2 = await sincronizar(null);
  assert.deepEqual(r2.errores, []);
  assert.deepEqual({ ...r2, errores: undefined }, { personas: 0, enlaces: 0, oportunidades: 0, avances: 0, errores: undefined }, "la segunda corrida no crea nada");

  const personasAna = await sql`SELECT id FROM crm_personas WHERE lower(correo) = ${correo("ana")}`;
  assert.equal(personasAna.rows.length, 1, "lead + cita + contacto de Ana = una sola persona");
  const refsAna = await sql<{ tabla: string }>`SELECT tabla FROM crm_personas_ref WHERE persona_id = ${personasAna.rows[0].id} ORDER BY tabla`;
  assert.deepEqual(refsAna.rows.map((x) => x.tabla), ["citas", "clave", "contactos", "leads"]);

  const [a] = await oportunidadDe(correo("ana"));
  assert.equal(a.etapa, "diagnostico_agendado");
  assert.equal(new Date(a.proximo_paso_at!).toISOString(), inicioA.toISOString(), "el próximo paso es la hora de la cita");
  const [b] = await oportunidadDe(`wa:${wa}`);
  assert.equal(b.etapa, "lead");
  const [c] = await oportunidadDe(correo("caro"));
  assert.equal(c.etapa, "perdido");
  assert.ok(c.motivo_perdida);

  // Lo que se mueve a mano en el CRM no lo retrocede el backfill.
  await moverEtapa(null, b.id, { a: "propuesta", proximoPaso: "Mandar propuesta", proximoPasoAt: "2027-01-10" });
  assert.equal((await sincronizar(null)).avances, 0);
  assert.equal((await oportunidadPorId(b.id))!.etapa, "propuesta");

  // E: llega como lead y después reserva → el backfill la avanza y deja historial.
  await lead("Eva Prueba", correo("eva"), `57313${s.slice(-7)}`);
  await sincronizar(null);
  assert.equal((await oportunidadDe(correo("eva")))[0].etapa, "lead");
  const citaE = await crearCita("Eva Prueba", correo("eva"), []);
  await reservar(citaE, horaFutura());
  const r3 = await sincronizar(null);
  assert.equal(r3.avances, 1);
  const [e] = await oportunidadDe(correo("eva"));
  assert.equal(e.etapa, "diagnostico_agendado");
  const hist = await sql<{ de: string | null; a: string }>`SELECT de, a FROM crm_etapas_historial WHERE oportunidad_id = ${e.id} ORDER BY id`;
  assert.deepEqual(hist.rows.map((h) => [h.de, h.a]), [[null, "lead"], ["lead", "diagnostico_agendado"]]);

  // Toda escritura deja auditoría, con origen sistema.
  const aud = await sql<{ accion: string; origen: string }>`SELECT accion, origen FROM crm_auditoria WHERE entidad = 'oportunidad' AND entidad_id = ${String(e.id)} ORDER BY id`;
  assert.deepEqual(aud.rows.map((x) => [x.accion, x.origen]), [["crear", "sistema"], ["mover_etapa", "sistema"]]);
});

test("con candado: dos llamadas seguidas corren una sola vez", async () => {
  await asegurarEsquema();
  const { usuario } = await crearUsuario(null, { nombre: "Sistema prueba", correo: `sis+${s}@agentes.calidev`, tipo: "agente", rol: "sistema" });
  const actor: Actor = { usuario, origen: "sistema", alcances: null, claveId: null };
  await sql`UPDATE crm_procesos SET ultimo_at = NULL, hasta = NULL WHERE clave = 'backfill'`;
  const [x, y] = await Promise.all([sincronizarSiToca(actor, 60), sincronizarSiToca(actor, 60)]);
  assert.equal([x, y].filter(Boolean).length, 1, "solo una de las dos toma el turno");
  assert.equal(await sincronizarSiToca(actor, 60), null, "dentro del intervalo no vuelve a correr");
});
