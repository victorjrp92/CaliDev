import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "../actor";
import { type CitaAgenda, citasEntre } from "../agenda";
import { listarProductos } from "../catalogo";
import { fechaHora } from "../formato";
import { agregarNota, notasDe } from "../notas";
import { type Hito, lineaDeTiempo, type Persona, personaPorId } from "../personas";
import { crearTarea } from "../tareas";
import { registroPorNit, type Registro } from "./croma";
import { actorDeAgente } from "./identidad";
import { listaDe, preguntarModelo, textoDe } from "./modelo";

/**
 * Agente de preparación (spec §9): antes de cada diagnóstico (primera cita)
 * escribe una nota `brief` en la cita con qué hace la empresa, su registro en
 * RUES si hay NIT, lo que dijo por DM o formulario, los procesos manuales que
 * mencionó, tres preguntas y qué producto encaja. Lo que falte para la llamada
 * queda como tarea «Pedir X antes de la llamada».
 *
 * Corre una vez al día (el plan Hobby no permite más): mira las citas de las
 * próximas 36 h, así toda cita queda preparada entre 12 y 36 h antes. Una cita
 * con brief no se toca otra vez, aunque se corra dos veces.
 */
const VENTANA_HORAS = 36;

type Empresa = { nombre: string; nit: string | null; sector: string | null; sitio: string | null; notas: string | null };

type Contexto = {
  cita: CitaAgenda;
  mensajeCita: string | null;
  persona: Persona | null;
  empresa: Empresa | null;
  conversacion: Hito[];
  registro: Registro;
};

export type ResultadoPreparacion = { revisadas: number; preparadas: number; tareas: number; errores: number };

async function contextoDe(cita: CitaAgenda): Promise<Contexto> {
  const mensajeCita = (await sql<{ mensaje: string | null }>`SELECT mensaje FROM citas WHERE id = ${cita.id}`).rows[0]?.mensaje ?? null;
  const persona = cita.persona_id ? await personaPorId(cita.persona_id) : null;
  const empresa = persona?.empresa_id
    ? ((await sql<Empresa>`SELECT nombre, nit, sector, sitio, notas FROM crm_empresas WHERE id = ${persona.empresa_id}`).rows[0] ?? null)
    : null;
  const conversacion = persona
    ? (await lineaDeTiempo(persona.id, 60)).filter((h) => ["dm", "formulario", "contacto", "nota"].includes(h.tipo) && h.detalle)
    : [];
  return { cita, mensajeCita, persona, empresa, conversacion, registro: await registroPorNit(empresa?.nit) };
}

/** Lo que falta se decide con datos, no con el modelo: sin empresa, sin conversación o sin WhatsApp. */
function faltantesFijos(c: Contexto): string[] {
  const f: string[] = [];
  if (!c.empresa) f.push("el nombre de la empresa");
  if (!c.conversacion.length && !c.mensajeCita?.trim()) f.push("qué quiere resolver con nosotros");
  if (!c.persona?.whatsapp) f.push("un WhatsApp de contacto");
  return f;
}

/** El registro mercantil tal como vino: campos simples, sin interpretar. */
function lineaRegistro(r: Registro): string {
  if (r.estado === "sin_nit") return "Sin NIT en la ficha: no se consultó el RUES.";
  if (r.estado === "sin_clave") return "Consulta al RUES apagada (falta CROMA_API_KEY).";
  if (r.estado === "no_encontrado") return "El NIT no aparece en el RUES.";
  if (r.estado === "fallo") return "El RUES no respondió; consultar a mano.";
  const simples = Object.entries(r.datos ?? {})
    .filter(([k, v]) => k !== "found" && v !== null && v !== "" && ["string", "number", "boolean"].includes(typeof v))
    .slice(0, 8)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v).slice(0, 120)}`);
  return simples.length ? simples.join(" · ") : "Encontrado en el RUES, sin campos legibles.";
}

function prompt(c: Contexto, productos: { nombre: string; descripcion: string | null }[]): string {
  const datos = {
    persona: c.persona ? { nombre: c.persona.nombre, origen: c.persona.origen, notas: c.persona.notas } : { nombre: c.cita.nombre },
    empresa: c.empresa,
    registro_mercantil: c.registro.estado === "encontrado" ? c.registro.datos : null,
    mensaje_al_reservar: c.mensajeCita,
    conversacion: c.conversacion.slice(0, 30).map((h) => ({ cuando: h.at, que: h.titulo, texto: (h.detalle ?? "").slice(0, 600) })),
    productos,
  };
  return [
    "Eres el agente de preparación del CRM de Calidev, una consultora de tecnología para empresas (sistemas de operación, apps, automatizaciones).",
    "Mañana hay una llamada de diagnóstico con este prospecto. Con SOLO los datos de abajo, prepara el brief.",
    "No inventes: si un dato no está, dilo («no se sabe»). Escribe en español, frases cortas.",
    "Devuelve JSON con estas claves:",
    '{"que_hace": "qué hace la empresa, 1-2 frases", "lo_que_dijo": "lo que pidió o contó por DM/formulario, 1-3 frases",',
    ' "procesos_manuales": ["procesos que hoy hace a mano, Excel, papel o WhatsApp, solo si los mencionó"],',
    ' "preguntas": ["tres preguntas para la llamada"], "producto": "nombre exacto de uno de los productos o null", "por_que": "por qué encaja, 1 frase",',
    ' "faltantes": ["dato concreto que conviene pedir antes de la llamada, máximo 3"]}',
    "",
    JSON.stringify(datos),
  ].join("\n");
}

const PREGUNTAS_BASE = [
  "¿Qué parte de la operación se lleva hoy en Excel, papel o WhatsApp?",
  "¿Cuánta gente y cuántas horas a la semana se van en eso?",
  "¿Qué pasa cuando eso falla, y cuánto le cuesta?",
];

type Brief = { cuerpo: string; faltantes: string[] };

async function redactar(c: Contexto, productos: { nombre: string; descripcion: string | null }[]): Promise<Brief> {
  let m: Record<string, unknown> | null = null;
  try {
    m = await preguntarModelo(prompt(c, productos));
  } catch (e) {
    // Sin modelo el brief sale igual con lo que hay; un error de otra cosa sí se cuenta.
    if (!(e instanceof ErrorCrm) || (e.estado !== 503 && e.estado !== 502)) throw e;
  }
  const nombres = new Set(productos.map((p) => p.nombre));
  const producto = textoDe(m?.producto, 120);
  const encaja = producto && nombres.has(producto) ? `${producto}${textoDe(m?.por_que, 300) ? ` — ${textoDe(m?.por_que, 300)}` : ""}` : "Sin sugerencia.";
  const preguntas = listaDe(m?.preguntas, 3);
  const procesos = listaDe(m?.procesos_manuales, 6);
  const dijo = textoDe(m?.lo_que_dijo, 600) ?? (c.mensajeCita?.trim() || (c.conversacion.length ? "Ver la línea de tiempo del contacto." : "No hay conversación registrada."));
  const faltantes = [...new Set([...faltantesFijos(c), ...listaDe(m?.faltantes, 3, 120)])];

  const cuerpo = [
    `Diagnóstico con ${c.persona?.nombre ?? c.cita.nombre} · ${fechaHora(c.cita.inicio)}${c.empresa ? ` · ${c.empresa.nombre}` : ""}`,
    "",
    `Qué hace la empresa: ${textoDe(m?.que_hace, 400) ?? (c.empresa?.sector ? `Sector: ${c.empresa.sector}.` : "No se sabe.")}`,
    `Registro mercantil: ${lineaRegistro(c.registro)}`,
    `Lo que dijo: ${dijo}`,
    `Procesos manuales que mencionó: ${procesos.length ? procesos.join("; ") : "ninguno registrado."}`,
    "",
    "Preguntas sugeridas:",
    ...(preguntas.length === 3 ? preguntas : PREGUNTAS_BASE).map((p, i) => `${i + 1}. ${p}`),
    "",
    `Producto que encaja: ${encaja}`,
    ...(faltantes.length ? ["", `Falta antes de la llamada: ${faltantes.join("; ")}.`] : []),
    ...(m ? [] : ["", "(El modelo no estaba disponible: preguntas genéricas y sin sugerencia de producto.)"]),
  ].join("\n");
  return { cuerpo, faltantes };
}

/** Prepara una cita. Devuelve null si ya tenía brief (otra corrida llegó antes). */
export async function prepararCita(agente: Actor, cita: CitaAgenda): Promise<{ tareas: number } | null> {
  if ((await notasDe("cita", cita.id)).some((n) => n.tipo === "brief")) return null;
  const productos = (await listarProductos(agente)).map((p) => ({ nombre: p.nombre, descripcion: p.descripcion }));
  const b = await redactar(await contextoDe(cita), productos);
  if ((await notasDe("cita", cita.id)).some((n) => n.tipo === "brief")) return null;
  await agregarNota(agente, { entidad: "cita", entidadId: cita.id, tipo: "brief", cuerpo: b.cuerpo });
  for (const f of b.faltantes) {
    await crearTarea(agente, { titulo: `Pedir ${f} antes de la llamada con ${cita.nombre}`, area: "agenda", entidad: "cita", entidadId: cita.id, venceAt: cita.inicio });
  }
  return { tareas: b.faltantes.length };
}

export async function prepararDiagnosticos(ahora = new Date()): Promise<ResultadoPreparacion> {
  const citas = (await citasEntre(ahora, new Date(ahora.getTime() + VENTANA_HORAS * 3600e3))).filter((c) => c.tipo === "primera" && !c.tiene_brief);
  const r: ResultadoPreparacion = { revisadas: citas.length, preparadas: 0, tareas: 0, errores: 0 };
  if (!citas.length) return r;
  const agente = await actorDeAgente("preparacion");
  for (const cita of citas) {
    try {
      const hecho = await prepararCita(agente, cita);
      if (hecho) {
        r.preparadas++;
        r.tareas += hecho.tareas;
      }
    } catch (e) {
      r.errores++;
      console.error(`Brief de la cita ${cita.id}:`, (e as Error).message);
    }
  }
  return r;
}
