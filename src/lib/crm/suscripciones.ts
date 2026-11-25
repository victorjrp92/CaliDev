import { sql } from "@/lib/db";
import { asegurarTabla } from "@/lib/contratos/datos";
import { type Actor, ErrorCrm } from "./actor";
import { diaColombia } from "./agenda";
import { auditar } from "./auditoria";
import { productoPorId, productoPorNombre } from "./catalogo";
import { dia, moneda, monto } from "./dinero";
import { exigir } from "./guardia";
import { oportunidadPorId } from "./oportunidades";

/**
 * Suscripciones (spec §4): el precio pactado con un cliente. Es la base del
 * MRR. Se crea sola al ganar una oportunidad con contrato firmado, o desde el
 * alta de cliente, o a mano.
 */
export type EstadoSuscripcion = "activa" | "pausada" | "cancelada";

export type Suscripcion = {
  id: number;
  empresa_id: number;
  empresa: string;
  persona_id: number | null;
  persona: string | null;
  producto_id: number;
  producto: string;
  oportunidad_id: number | null;
  contrato_id: number | null;
  valor_arranque: string | null;
  valor_mensual: string;
  moneda: string;
  personas: number | null;
  permanencia_hasta: string | null;
  inicio: string;
  estado: EstadoSuscripcion;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
};

async function porId(id: number): Promise<Suscripcion | null> {
  const r = await sql<Suscripcion>`
    SELECT s.id, s.empresa_id, e.nombre AS empresa, s.persona_id, p.nombre AS persona, s.producto_id, pr.nombre AS producto,
      s.oportunidad_id, s.contrato_id, s.valor_arranque, s.valor_mensual, s.moneda, s.personas,
      s.permanencia_hasta::text AS permanencia_hasta, s.inicio::text AS inicio, s.estado, s.creado_por, s.created_at, s.updated_at
    FROM crm_suscripciones s JOIN crm_empresas e ON e.id = s.empresa_id JOIN crm_productos pr ON pr.id = s.producto_id
    LEFT JOIN crm_personas p ON p.id = s.persona_id
    WHERE s.id = ${id}`;
  return r.rows[0] ?? null;
}

export async function suscripcionPorId(actor: Actor | null, id: number): Promise<Suscripcion> {
  if (actor) exigir(actor, "finanzas:leer");
  const s = await porId(id);
  if (!s) throw new ErrorCrm(404, "no_existe", `No hay suscripción ${id}.`);
  return s;
}

export async function listarSuscripciones(actor: Actor, f: { estado?: string | null; empresaId?: number | null } = {}): Promise<Suscripcion[]> {
  exigir(actor, "finanzas:leer");
  const estado = f.estado === "todas" ? null : (f.estado ?? "activa");
  if (estado && !["activa", "pausada", "cancelada"].includes(estado)) throw new ErrorCrm(400, "campo_invalido", "estado: activa, pausada, cancelada o todas.", "estado");
  const r = await sql<{ id: number }>`
    SELECT id FROM crm_suscripciones
    WHERE (${estado}::text IS NULL OR estado = ${estado}) AND (${f.empresaId ?? null}::int IS NULL OR empresa_id = ${f.empresaId ?? null})
    ORDER BY created_at DESC, id DESC LIMIT 500`;
  return Promise.all(r.rows.map(async (x) => (await porId(x.id))!));
}

export type NuevaSuscripcion = {
  empresaId?: unknown;
  personaId?: unknown;
  productoId?: unknown;
  oportunidadId?: unknown;
  contratoId?: unknown;
  valorArranque?: unknown;
  valorMensual?: unknown;
  moneda?: unknown;
  personas?: unknown;
  permanenciaHasta?: unknown;
  inicio?: unknown;
};

const entero = (v: unknown, campo: string): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un número entero.`, campo);
  return n;
};

/** Sin chequeo de permiso: lo usan `crearSuscripcion`, el alta de cliente y el paso a ganado. */
export async function insertarSuscripcion(actor: Actor | null, d: NuevaSuscripcion, ahora = new Date()): Promise<{ suscripcion: Suscripcion; nueva: boolean }> {
  const empresaId = entero(d.empresaId, "empresa_id");
  if (!empresaId) throw new ErrorCrm(400, "campo_requerido", "La suscripción necesita la empresa del cliente.", "empresa_id");
  const e = await sql`SELECT 1 FROM crm_empresas WHERE id = ${empresaId}`;
  if (!e.rows[0]) throw new ErrorCrm(404, "no_existe", `No hay empresa ${empresaId}.`, "empresa_id");
  const productoId = entero(d.productoId, "producto_id");
  if (!productoId) throw new ErrorCrm(400, "campo_requerido", "Falta el producto.", "producto_id");
  await productoPorId(null, productoId);
  const mensual = monto(d.valorMensual, "valor_mensual", { requerido: true })!;
  const arranque = monto(d.valorArranque, "valor_arranque");
  const m = moneda(d.moneda ?? "COP");
  const inicio = dia(d.inicio, "inicio") ?? diaColombia(null, ahora).dia;
  const oportunidadId = entero(d.oportunidadId, "oportunidad_id");
  const r = await sql<{ id: number }>`
    INSERT INTO crm_suscripciones (empresa_id, persona_id, producto_id, oportunidad_id, contrato_id, valor_arranque, valor_mensual,
      moneda, personas, permanencia_hasta, inicio, creado_por)
    VALUES (${empresaId}, ${entero(d.personaId, "persona_id")}, ${productoId}, ${oportunidadId}, ${entero(d.contratoId, "contrato_id")},
      ${arranque}, ${mensual}, ${m}, ${entero(d.personas, "personas")}, ${dia(d.permanenciaHasta, "permanencia_hasta")}, ${inicio},
      ${actor?.usuario.id ?? null})
    ON CONFLICT (oportunidad_id) WHERE oportunidad_id IS NOT NULL DO NOTHING
    RETURNING id`;
  if (!r.rows[0]) {
    const previa = await sql<{ id: number }>`SELECT id FROM crm_suscripciones WHERE oportunidad_id = ${oportunidadId}`;
    return { suscripcion: (await porId(previa.rows[0].id))!, nueva: false };
  }
  const s = (await porId(r.rows[0].id))!;
  await auditar(actor, "crear", "suscripcion", s.id, null, s);
  return { suscripcion: s, nueva: true };
}

export async function crearSuscripcion(actor: Actor, d: NuevaSuscripcion): Promise<Suscripcion> {
  exigir(actor, "finanzas:escribir");
  return (await insertarSuscripcion(actor, d)).suscripcion;
}

/** estado y datos con finanzas:escribir; cambiar el valor pactado pide además precio:fijar. */
export async function editarSuscripcion(actor: Actor, id: number, d: Record<string, unknown>): Promise<Suscripcion> {
  exigir(actor, "finanzas:escribir");
  const antes = await suscripcionPorId(null, id);
  if ("valor_mensual" in d || "valor_arranque" in d || "moneda" in d) exigir(actor, "precio:fijar");
  if ("estado" in d && !["activa", "pausada", "cancelada"].includes(d.estado as string)) throw new ErrorCrm(400, "campo_invalido", "estado: activa, pausada o cancelada.", "estado");
  const estado = (d.estado as EstadoSuscripcion | undefined) ?? antes.estado;
  const mensual = "valor_mensual" in d ? monto(d.valor_mensual, "valor_mensual", { requerido: true }) : antes.valor_mensual;
  const arranque = "valor_arranque" in d ? monto(d.valor_arranque, "valor_arranque") : antes.valor_arranque;
  const m = "moneda" in d ? moneda(d.moneda) : antes.moneda;
  const personas = "personas" in d ? entero(d.personas, "personas") : antes.personas;
  const hasta = "permanencia_hasta" in d ? dia(d.permanencia_hasta, "permanencia_hasta") : antes.permanencia_hasta;
  await sql`
    UPDATE crm_suscripciones SET estado = ${estado}, valor_mensual = ${mensual}, valor_arranque = ${arranque}, moneda = ${m},
      personas = ${personas}, permanencia_hasta = ${hasta}, updated_at = NOW()
    WHERE id = ${id}`;
  const despues = (await porId(id))!;
  await auditar(actor, "editar", "suscripcion", id, antes, despues);
  return despues;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «31 de diciembre de 2027» → 2027-12-31; lo que no se entienda, null. */
export function fechaDeTexto(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const m = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de|del)\s+(\d{4})/i.exec(t.trim());
  if (!m) return null;
  const mes = MESES.indexOf(m[2].toLowerCase()) + 1;
  if (!mes) return null;
  const s = `${m[3]}-${String(mes).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  try {
    return dia(s, "fecha");
  } catch {
    return null;
  }
}

/**
 * Al ganar una oportunidad: si tiene un contrato firmado por todos, crea su
 * suscripción con lo que dice el contrato (o, si no lo dice, con los valores
 * de la oportunidad). Devuelve null si falta empresa, contrato firmado o
 * mensualidad: no inventa un cliente. Idempotente por oportunidad.
 *
 * Los cobros de las cuotas del contrato NO se crean aquí: se registran desde
 * Finanzas (pendiente para una entrega posterior).
 */
export async function suscripcionDesdeGanada(actor: Actor | null, oportunidadId: number, ahora = new Date()): Promise<Suscripcion | null> {
  const o = await oportunidadPorId(oportunidadId);
  if (!o || o.etapa !== "ganado" || !o.empresa_id) return null;
  await asegurarTabla();
  const c = await sql<{ contrato_id: number; datos: string | null; plantilla: string }>`
    SELECT cc.contrato_id, k.datos, cc.plantilla FROM crm_contratos cc JOIN contratos k ON k.id = cc.contrato_id
    WHERE cc.oportunidad_id = ${oportunidadId}
      AND EXISTS (SELECT 1 FROM contrato_firmantes f WHERE f.contrato_id = cc.contrato_id)
      AND NOT EXISTS (SELECT 1 FROM contrato_firmantes f WHERE f.contrato_id = cc.contrato_id AND f.firmado_at IS NULL)
    ORDER BY cc.created_at DESC, cc.contrato_id DESC LIMIT 1`;
  const contrato = c.rows[0];
  if (!contrato) return null;
  let datos: Record<string, unknown> = {};
  try {
    datos = contrato.datos ? (JSON.parse(contrato.datos) as Record<string, unknown>) : {};
  } catch {
    datos = {};
  }
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const mensual = num(datos.mensualidad) ?? (o.valor_mensual !== null ? Number(o.valor_mensual) : null);
  if (mensual === null) return null;
  const propio = (o as { producto_id?: number | null }).producto_id;
  const existe = propio ? (await sql`SELECT 1 FROM crm_productos WHERE id = ${propio}`).rows[0] : null;
  const productoId = existe ? propio : (await productoPorNombre("ServiNomic"))?.id;
  if (!productoId) return null;
  const r = await insertarSuscripcion(actor, {
    empresaId: o.empresa_id,
    personaId: o.persona_id,
    productoId,
    oportunidadId,
    contratoId: contrato.contrato_id,
    valorArranque: num(datos.arranque) ?? (o.valor_arranque !== null ? Number(o.valor_arranque) : null),
    valorMensual: mensual,
    moneda: contrato.plantilla === "servinomic" ? "COP" : o.moneda,
    personas: num(datos.personas),
    permanenciaHasta: fechaDeTexto(datos.permanenciaHasta),
  }, ahora);
  return r.suscripcion;
}
