import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";
import { type Etapa, ETAPAS_ABIERTAS, esEtapa, estaAbierta, problemaDeCambio } from "./etapas";
import { exigir } from "./guardia";

/**
 * Oportunidades de venta (spec §3, pestaña 5). Toda la escritura pasa por
 * aquí para que la UI, la API y el backfill apliquen las mismas reglas:
 * - abierta ⇒ próximo paso con fecha (también CHECK en la base);
 * - perdida ⇒ motivo;
 * - ganar exige `oportunidad:ganar`, que ningún agente tiene;
 * - cada cambio de etapa deja historial (para las métricas) y auditoría.
 */
export type Oportunidad = {
  id: number;
  titulo: string;
  empresa_id: number | null;
  empresa: string | null;
  persona_id: number | null;
  persona: string | null;
  etapa: Etapa;
  valor_arranque: string | null;
  valor_mensual: string | null;
  moneda: string;
  responsable_id: number | null;
  responsable: string | null;
  proximo_paso: string | null;
  proximo_paso_at: string | null;
  motivo_perdida: string | null;
  origen: string | null;
  clave_legado: string | null;
  created_at: string;
  updated_at: string;
};

export async function oportunidadPorId(id: number): Promise<Oportunidad | null> {
  const r = await sql<Oportunidad>`
    SELECT o.*, e.nombre AS empresa, p.nombre AS persona, u.nombre AS responsable
    FROM crm_oportunidades o LEFT JOIN crm_empresas e ON e.id = o.empresa_id
    LEFT JOIN crm_personas p ON p.id = o.persona_id LEFT JOIN crm_usuarios u ON u.id = o.responsable_id
    WHERE o.id = ${id}`;
  return r.rows[0] ?? null;
}

export async function listarOportunidades(f: { etapa?: string | null; abiertas?: boolean; personaId?: number | null; vencenAntes?: string | null; limite?: number } = {}): Promise<Oportunidad[]> {
  if (f.etapa && !esEtapa(f.etapa)) throw new ErrorCrm(400, "campo_invalido", "Etapa desconocida.", "etapa");
  const lim = Math.min(Math.max(f.limite ?? 500, 1), 1000);
  const r = await sql<Oportunidad>`
    SELECT o.*, e.nombre AS empresa, p.nombre AS persona, u.nombre AS responsable
    FROM crm_oportunidades o LEFT JOIN crm_empresas e ON e.id = o.empresa_id
    LEFT JOIN crm_personas p ON p.id = o.persona_id LEFT JOIN crm_usuarios u ON u.id = o.responsable_id
    WHERE (${f.etapa ?? null}::text IS NULL OR o.etapa = ${f.etapa ?? null})
      AND (${f.abiertas ? ETAPAS_ABIERTAS : null}::text[] IS NULL OR o.etapa = ANY(${f.abiertas ? ETAPAS_ABIERTAS : null}::text[]))
      AND (${f.personaId ?? null}::int IS NULL OR o.persona_id = ${f.personaId ?? null})
      AND (${f.vencenAntes ?? null}::timestamptz IS NULL OR o.proximo_paso_at < ${f.vencenAntes ?? null})
    ORDER BY o.proximo_paso_at ASC NULLS LAST, o.id DESC LIMIT ${lim}`;
  return r.rows;
}

function monto(v: unknown, campo: string): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[.\s]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un número positivo (COP sin puntos: 2500000).`, campo);
  return n;
}

/** Fecha del próximo paso: «AAAA-MM-DD» se entiende como ese día a las 9:00 de Colombia. */
export function fechaPaso(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T09:00:00-05:00` : s;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export type NuevaOportunidad = {
  titulo: string;
  personaId?: number | null;
  empresaId?: number | null;
  etapa?: string;
  proximoPaso?: string | null;
  proximoPasoAt?: string | null;
  valorArranque?: unknown;
  valorMensual?: unknown;
  moneda?: string;
  responsableId?: number | null;
  origen?: string | null;
  claveLegado?: string | null;
  motivoPerdida?: string | null;
};

export async function crearOportunidad(actor: Actor | null, d: NuevaOportunidad): Promise<Oportunidad> {
  const titulo = d.titulo?.trim();
  if (!titulo) throw new ErrorCrm(400, "campo_requerido", "La oportunidad necesita un título (p. ej. «ServiNomic para Limpia Express»).", "titulo");
  const etapa = (d.etapa ?? "lead") as Etapa;
  const at = fechaPaso(d.proximoPasoAt);
  const motivo = etapa === "perdido" ? d.motivoPerdida?.trim() || null : null;
  const problema = problemaDeCambio({ a: etapa, proximoPaso: d.proximoPaso, proximoPasoAt: at, motivoPerdida: motivo });
  if (problema) throw new ErrorCrm(400, "regla_etapa", problema.mensaje, problema.campo);
  if (etapa === "ganado" && actor) exigir(actor, "oportunidad:ganar");
  const moneda = (d.moneda ?? "COP").toUpperCase();
  if (!["COP", "EUR", "USD"].includes(moneda)) throw new ErrorCrm(400, "campo_invalido", "Moneda: COP, EUR o USD.", "moneda");

  const r = await sql<{ id: number }>`
    INSERT INTO crm_oportunidades (titulo, persona_id, empresa_id, etapa, valor_arranque, valor_mensual, moneda,
      responsable_id, proximo_paso, proximo_paso_at, motivo_perdida, origen, clave_legado)
    VALUES (${titulo}, ${d.personaId ?? null}, ${d.empresaId ?? null}, ${etapa}, ${monto(d.valorArranque, "valor_arranque")},
      ${monto(d.valorMensual, "valor_mensual")}, ${moneda}, ${d.responsableId ?? null}, ${d.proximoPaso?.trim() || null}, ${at},
      ${motivo}, ${d.origen ?? null}, ${d.claveLegado ?? null})
    ON CONFLICT (clave_legado) DO NOTHING
    RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(409, "duplicada", `Ya hay una oportunidad para ${d.claveLegado}.`);
  const id = r.rows[0].id;
  await sql`INSERT INTO crm_etapas_historial (oportunidad_id, de, a, usuario_id) VALUES (${id}, NULL, ${etapa}, ${actor?.usuario.id ?? null})`;
  const o = (await oportunidadPorId(id))!;
  await auditar(actor, "crear", "oportunidad", id, null, o);
  return o;
}

/** Los drivers devuelven TIMESTAMPTZ como Date aunque el tipo diga string: se compara siempre en ISO. */
const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null);

export type Movimiento = { a: string; proximoPaso?: string | null; proximoPasoAt?: string | null; motivoPerdida?: string | null };

/**
 * Cambia la etapa. El UPDATE exige que la etapa siga siendo la leída: si dos
 * personas mueven a la vez, la segunda recibe 409 en vez de pisar a la primera
 * y dejar el historial mintiendo.
 */
export async function moverEtapa(actor: Actor | null, id: number, m: Movimiento): Promise<Oportunidad> {
  const antes = await oportunidadPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${id}.`);
  const a = m.a as Etapa;
  const abierta = esEtapa(a) && estaAbierta(a);
  // Si no manda próximo paso al moverla entre abiertas, se conserva el que tenía.
  const paso = abierta ? (m.proximoPaso?.trim() || antes.proximo_paso) : (m.proximoPaso?.trim() || null);
  const at = abierta ? (fechaPaso(m.proximoPasoAt) ?? (m.proximoPasoAt ? null : iso(antes.proximo_paso_at))) : fechaPaso(m.proximoPasoAt);
  const motivo = a === "perdido" ? m.motivoPerdida?.trim() || null : null;
  const problema = problemaDeCambio({ a, proximoPaso: paso, proximoPasoAt: at, motivoPerdida: motivo });
  if (problema) throw new ErrorCrm(400, "regla_etapa", problema.mensaje, problema.campo);
  if (a === "ganado" && actor) exigir(actor, "oportunidad:ganar");
  if (a === antes.etapa && paso === antes.proximo_paso && at === iso(antes.proximo_paso_at)) return antes;

  const r = await sql`
    UPDATE crm_oportunidades SET etapa = ${a}, proximo_paso = ${paso}, proximo_paso_at = ${at},
      motivo_perdida = ${motivo}, updated_at = NOW()
    WHERE id = ${id} AND etapa = ${antes.etapa} RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(409, "cambio_concurrente", "Alguien movió esta oportunidad mientras tanto. Recarga y vuelve a intentar.");
  if (a !== antes.etapa) {
    await sql`INSERT INTO crm_etapas_historial (oportunidad_id, de, a, usuario_id) VALUES (${id}, ${antes.etapa}, ${a}, ${actor?.usuario.id ?? null})`;
  }
  const despues = (await oportunidadPorId(id))!;
  await auditar(actor, a !== antes.etapa ? "mover_etapa" : "proximo_paso", "oportunidad", id, antes, despues);
  // Ganada con contrato firmado: nace la suscripción (spec §10). Sin contrato no pasa nada.
  if (a === "ganado" && antes.etapa !== "ganado") {
    try {
      const { suscripcionDesdeGanada } = await import("./suscripciones");
      await suscripcionDesdeGanada(actor, id);
    } catch (e) {
      console.error("CRM: no se creó la suscripción de la oportunidad", id, e);
    }
  }
  return despues;
}

/** Solo el próximo paso, sin tocar la etapa. */
export async function fijarProximoPaso(actor: Actor | null, id: number, paso: string, fecha: string): Promise<Oportunidad> {
  const o = await oportunidadPorId(id);
  if (!o) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${id}.`);
  if (!estaAbierta(o.etapa)) throw new ErrorCrm(400, "regla_etapa", `Está ${o.etapa}: muévela a una etapa abierta para darle próximo paso.`, "etapa");
  return moverEtapa(actor, id, { a: o.etapa, proximoPaso: paso, proximoPasoAt: fecha });
}

export type CambiosOportunidad = { titulo?: string; valorArranque?: unknown; valorMensual?: unknown; moneda?: string; responsableId?: number | null; personaId?: number | null; empresaId?: number | null };

export async function editarOportunidad(actor: Actor, id: number, c: CambiosOportunidad): Promise<Oportunidad> {
  const antes = await oportunidadPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${id}.`);
  const titulo = c.titulo !== undefined ? c.titulo.trim() : antes.titulo;
  if (!titulo) throw new ErrorCrm(400, "campo_requerido", "El título no puede quedar vacío.", "titulo");
  const arr = "valorArranque" in c ? monto(c.valorArranque, "valor_arranque") : antes.valor_arranque;
  const men = "valorMensual" in c ? monto(c.valorMensual, "valor_mensual") : antes.valor_mensual;
  const moneda = (c.moneda ?? antes.moneda).toUpperCase();
  if (!["COP", "EUR", "USD"].includes(moneda)) throw new ErrorCrm(400, "campo_invalido", "Moneda: COP, EUR o USD.", "moneda");
  await sql`
    UPDATE crm_oportunidades SET titulo = ${titulo}, valor_arranque = ${arr}, valor_mensual = ${men}, moneda = ${moneda},
      responsable_id = ${"responsableId" in c ? (c.responsableId ?? null) : antes.responsable_id},
      persona_id = ${"personaId" in c ? (c.personaId ?? null) : antes.persona_id},
      empresa_id = ${"empresaId" in c ? (c.empresaId ?? null) : antes.empresa_id},
      updated_at = NOW()
    WHERE id = ${id}`;
  const despues = (await oportunidadPorId(id))!;
  await auditar(actor, "editar", "oportunidad", id, antes, despues);
  return despues;
}

export async function historialDe(id: number) {
  const r = await sql<{ de: string | null; a: string; at: string; usuario: string | null }>`
    SELECT h.de, h.a, h.at, u.nombre AS usuario FROM crm_etapas_historial h LEFT JOIN crm_usuarios u ON u.id = h.usuario_id
    WHERE h.oportunidad_id = ${id} ORDER BY h.at, h.id`;
  return r.rows;
}
