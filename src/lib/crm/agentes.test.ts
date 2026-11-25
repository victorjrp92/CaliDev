import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@/lib/db";
import { crearCita, reservar } from "@/lib/citas/datos";
import type { Correo } from "@/lib/delegar/correos/enviar";
import { type Actor, ErrorCrm } from "./actor";
import { decidir } from "./aprobaciones";
import { usarEnviadorCobros, proponerRecordatorios } from "./agentes/cobros";
import { usarCroma } from "./agentes/croma";
import { actorDeAgente } from "./agentes/identidad";
import { usarModelo } from "./agentes/modelo";
import { prepararDiagnosticos } from "./agentes/preparacion";
import { resumirLlamada } from "./agentes/resumen";
import { crearCobro, registrarPago } from "./cobros";
import { asegurarEsquema } from "./esquema";
import { notasDe } from "./notas";
import { crearOportunidad, moverEtapa, oportunidadPorId } from "./oportunidades";
import { crearPersona, enlazar } from "./personas";
import { usarProveedorTasas } from "./tasas";
import { crearUsuario } from "./usuarios";

/**
 * Agentes de spec §9 contra la base local, sin red: el modelo, Croma y Resend
 * son falsos y deterministas.
 *   SUPABASE_DB_URL=… CRM_JWT_SECRET=… npx tsx --test src/lib/crm/agentes.test.ts
 */
const s = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
usarProveedorTasas(async () => ({ eur: 4500, usd: 4000, fuente: "prueba" }));

let modeloCaido = false;
let producto = "";
usarModelo(async (p) => {
  if (modeloCaido) throw new ErrorCrm(503, "modelo_no_disponible", "Sin modelo en la prueba.");
  if (p.includes("agente de preparación")) {
    return {
      que_hace: "Empresa de aseo con 40 operarias.",
      lo_que_dijo: "Lleva la nómina en Excel.",
      procesos_manuales: ["nómina en Excel"],
      preguntas: ["¿Cuántas sedes?", "¿Quién liquida?", "¿Cada cuánto pagan?"],
      producto,
      por_que: "La nómina es su dolor.",
      faltantes: ["el número de sedes"],
    };
  }
  return { resumen: "Usan Excel para la nómina; quieren propuesta.", etapa: "diagnostico_hecho", proximo_paso: "Enviar propuesta", proximo_paso_at: "2033-07-01", motivo_perdida: null };
});
const consultas: string[] = [];
usarCroma(async (nit) => {
  consultas.push(nit);
  return { estado: "encontrado", datos: { razon_social: `ASEO NIT ${s} SAS`, found: true } };
});
const enviados: Correo[] = [];
usarEnviadorCobros(async (c) => {
  enviados.push(c);
  return true;
});

async function dueno(): Promise<Actor> {
  const { usuario } = await crearUsuario(null, { nombre: "Dueño agentes", correo: `dueno-ag+${s}@prueba.dev`, tipo: "humano", rol: "dueno" });
  return { usuario, origen: "ui", alcances: null, claveId: null };
}

const estadoErr = (estado: number) => (e: unknown) => (e as { estado?: number }).estado === estado;

test("agentes: preparación, resumen y cobros pasan por Aprobaciones", async () => {
  await asegurarEsquema();
  const yo = await dueno();
  producto = (await sql<{ nombre: string }>`SELECT nombre FROM crm_productos WHERE lower(nombre) = 'servinomic'`).rows[0].nombre;

  // ── Preparación ─────────────────────────────────────────────
  // Un día lejano y único: el índice de citas exige inicio único.
  const base = new Date(Date.now() + (5000 + Math.floor(Math.random() * 3000)) * 864e5);
  const dia = base.toISOString().slice(0, 10);
  const ahora = new Date(`${dia}T05:00:00-05:00`);
  const inicio1 = new Date(ahora.getTime() + 20 * 3600e3);
  const inicio2 = new Date(ahora.getTime() + 22 * 3600e3);
  const fuera = new Date(ahora.getTime() + 40 * 3600e3);

  // Sin empresa ni WhatsApp ni mensaje: tres faltantes fijos + el del modelo.
  const p1 = await crearPersona(yo, { nombre: "Sin Datos", correo: `sin-datos+${s}@prueba.dev`, origen: "prueba" });
  const c1 = await crearCita("Sin Datos", `sin-datos+${s}@prueba.dev`, []);
  assert.equal((await reservar(c1, inicio1)).ok, true);
  await enlazar(p1.id, "citas", c1.id);

  // Con empresa, NIT, WhatsApp y mensaje: va al RUES; esta corre con el modelo caído.
  const p2 = await crearPersona(yo, { nombre: "Con Datos", correo: `con-datos+${s}@prueba.dev`, whatsapp: "+573001112233", empresa: `Aseo Datos ${s}`, origen: "prueba" });
  await sql`UPDATE crm_empresas SET nit = '900123456-7' WHERE id = ${p2.empresa_id}`;
  const c2 = await crearCita("Con Datos", `con-datos+${s}@prueba.dev`, [], { mensaje: "Queremos dejar el Excel de la nómina." });
  assert.equal((await reservar(c2, inicio2)).ok, true);
  await enlazar(p2.id, "citas", c2.id);

  // Fuera de la ventana de 36 h: no se toca.
  const c3 = await crearCita("Lejana", `lejana+${s}@prueba.dev`, []);
  assert.equal((await reservar(c3, fuera)).ok, true);

  // Primero solo c1 con modelo (c2 aún no tiene persona preparada: corremos dos veces con modelo distinto).
  const r1 = await prepararDiagnosticos(ahora);
  assert.equal(r1.errores, 0);
  assert.ok(r1.preparadas >= 2, `preparó ${r1.preparadas}`);
  const brief1 = (await notasDe("cita", c1.id)).filter((n) => n.tipo === "brief");
  assert.equal(brief1.length, 1);
  assert.match(brief1[0].cuerpo, /Qué hace la empresa: Empresa de aseo/);
  assert.match(brief1[0].cuerpo, new RegExp(`Producto que encaja: ${producto} — La nómina`));
  assert.match(brief1[0].cuerpo, /Sin NIT en la ficha/);
  const tareas1 = (await sql<{ titulo: string }>`SELECT titulo FROM crm_tareas WHERE entidad = 'cita' AND entidad_id = ${String(c1.id)} ORDER BY id`).rows.map((t) => t.titulo);
  for (const f of ["el nombre de la empresa", "qué quiere resolver con nosotros", "un WhatsApp de contacto", "el número de sedes"]) {
    assert.ok(tareas1.includes(`Pedir ${f} antes de la llamada con Sin Datos`), `falta la tarea de «${f}»: ${tareas1.join(" | ")}`);
  }
  assert.deepEqual(consultas, ["900123456"], "solo la cita con NIT consulta el RUES, sin dígito de verificación");
  const brief2 = (await notasDe("cita", c2.id)).filter((n) => n.tipo === "brief");
  assert.equal(brief2.length, 1);
  assert.match(brief2[0].cuerpo, new RegExp(`razon social: ASEO NIT ${s} SAS`));
  assert.match(brief2[0].cuerpo, /Lo que dijo: Lleva la nómina en Excel/);
  assert.equal((await notasDe("cita", c3.id)).length, 0, "la cita a 40 h no se prepara");

  // Idempotente: otra corrida no repite brief ni tareas.
  const tareasAntes = (await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM crm_tareas WHERE entidad = 'cita' AND entidad_id IN (${String(c1.id)}, ${String(c2.id)})`).rows[0].n;
  await prepararDiagnosticos(ahora);
  assert.equal((await notasDe("cita", c1.id)).filter((n) => n.tipo === "brief").length, 1);
  assert.equal((await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM crm_tareas WHERE entidad = 'cita' AND entidad_id IN (${String(c1.id)}, ${String(c2.id)})`).rows[0].n, tareasAntes);

  // Modelo caído: el brief sale igual, con preguntas genéricas.
  modeloCaido = true;
  const c4 = await crearCita("Sin Modelo", `sin-modelo+${s}@prueba.dev`, []);
  assert.equal((await reservar(c4, new Date(ahora.getTime() + 24 * 3600e3))).ok, true);
  const r4 = await prepararDiagnosticos(ahora);
  modeloCaido = false;
  assert.equal(r4.errores, 0);
  const brief4 = (await notasDe("cita", c4.id)).find((n) => n.tipo === "brief");
  assert.ok(brief4, "sin modelo también hay brief");
  assert.match(brief4.cuerpo, /El modelo no estaba disponible/);
  assert.match(brief4.cuerpo, /1\. ¿Qué parte de la operación/);
  assert.match(brief4.cuerpo, /Producto que encaja: Sin sugerencia/);

  // ── Resumen ─────────────────────────────────────────────────
  const op = await crearOportunidad(yo, { titulo: `Aseo Datos ${s}`, personaId: p2.id, empresaId: p2.empresa_id, etapa: "diagnostico_agendado", proximoPaso: "Llamada", proximoPasoAt: "2033-06-01" });
  await assert.rejects(resumirLlamada(yo, { oportunidadId: op.id, notas: "corto" }), estadoErr(400));
  const res = await resumirLlamada(yo, { citaId: c2.id, notas: "Tienen 40 operarias, la nómina va en Excel y quieren propuesta esta semana." });
  assert.equal(res.nota.tipo, "resumen_llamada");
  assert.equal(res.nota.entidad, "oportunidad", "por la cita llega a la oportunidad abierta de la persona");
  assert.equal(Number(res.nota.entidad_id), op.id);
  assert.match(res.nota.cuerpo, /— Notas de Dueño agentes —\nTienen 40 operarias/);
  assert.ok(res.aprobacion, res.problema ?? "sin aprobación");
  assert.equal(res.aprobacion.estado, "pendiente");
  assert.equal(res.aprobacion.tipo, "mover_etapa");
  assert.equal((await oportunidadPorId(op.id))!.etapa, "diagnostico_agendado", "proponer no mueve nada");

  const agenteResumen = await actorDeAgente("resumen");
  await assert.rejects(decidir(agenteResumen, res.aprobacion.id, { decision: "aprobar" }), estadoErr(403));
  const hecha = await decidir(yo, res.aprobacion.id, { decision: "aprobar" });
  assert.equal(hecha.estado, "ejecutada", JSON.stringify(hecha.resultado));
  const movida = (await oportunidadPorId(op.id))!;
  assert.equal(movida.etapa, "diagnostico_hecho");
  assert.equal(movida.proximo_paso, "Enviar propuesta");

  // Propuesta vieja: alguien movió la oportunidad antes de aprobar → fallida, no se pisa.
  const res2 = await resumirLlamada(yo, { oportunidadId: op.id, notas: "Segunda llamada: siguen interesados en la propuesta de nómina." });
  assert.ok(res2.aprobacion);
  await moverEtapa(yo, op.id, { a: "propuesta", proximoPaso: "Esperar respuesta", proximoPasoAt: "2033-07-10" });
  const vieja = await decidir(yo, res2.aprobacion.id, { decision: "aprobar" });
  assert.equal(vieja.estado, "fallida");
  assert.match(JSON.stringify(vieja.resultado), /pasó a propuesta/);
  assert.equal((await oportunidadPorId(op.id))!.etapa, "propuesta");

  // ── Cobros ──────────────────────────────────────────────────
  const hoyCobro = new Date("2033-05-01T15:00:00Z");
  const enMora = new Date("2033-06-15T15:00:00Z");
  const k1 = await crearCobro(yo, { personaId: p2.id, concepto: "mensualidad", valor: 250_000, moneda: "COP", venceAt: "2033-05-10" }, hoyCobro);
  const k2 = await crearCobro(yo, { personaId: p2.id, concepto: "otro", valor: 90_000, moneda: "COP", venceAt: "2033-05-12" }, hoyCobro);
  assert.equal(k1.estado, "creado");
  assert.equal(k2.estado, "creado");
  const id1 = k1.estado === "creado" ? k1.cobro.id : 0;
  const id2 = k2.estado === "creado" ? k2.cobro.id : 0;

  const cuantosCobros = async () => (await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM crm_cobros`).rows[0].n;
  const recordatorios = async (id: number) =>
    (await sql<{ id: number; estado: string; payload: Record<string, unknown> }>`SELECT id, estado, payload FROM crm_aprobaciones WHERE tipo = 'recordar_cobro' AND entidad = 'cobro' AND entidad_id = ${String(id)} ORDER BY id`).rows;

  const cobrosAntes = await cuantosCobros();
  const rc = await proponerRecordatorios(enMora);
  assert.ok(rc.propuestos >= 2, JSON.stringify(rc));
  assert.equal(await cuantosCobros(), cobrosAntes, "el agente no crea cobros");
  const [a1] = await recordatorios(id1);
  assert.ok(a1, "propuso recordatorio del cobro en mora");
  assert.equal(a1.estado, "pendiente");
  assert.equal(a1.payload.correo, `con-datos+${s}@prueba.dev`);
  assert.match(String(a1.payload.texto), /venció el/);

  // Segunda corrida: no repite.
  const rc2 = await proponerRecordatorios(enMora);
  assert.equal((await recordatorios(id1)).length, 1);
  assert.ok(rc2.ya_avisados >= 2);

  // Aprobado → sale por el enviador falso.
  const ok = await decidir(yo, a1.id, { decision: "aprobar" });
  assert.equal(ok.estado, "ejecutada", JSON.stringify(ok.resultado));
  const correo = enviados.find((c) => c.para === `con-datos+${s}@prueba.dev`);
  assert.ok(correo, "se mandó el recordatorio");
  assert.match(correo.asunto, /Recordatorio de pago/);

  // Cobro pagado mientras esperaba: el ejecutor no manda.
  const [a2] = await recordatorios(id2);
  await registrarPago(yo, id2, { metodo: "transferencia" }, enMora);
  const n = enviados.length;
  const no = await decidir(yo, a2.id, { decision: "aprobar" });
  assert.equal(no.estado, "fallida");
  assert.match(JSON.stringify(no.resultado), /pagado/);
  assert.equal(enviados.length, n, "no salió correo del cobro pagado");
});
