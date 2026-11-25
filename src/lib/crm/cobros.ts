import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { savePaymentLink } from "@/lib/payments";
import { type Actor, ErrorCrm } from "./actor";
import { diaColombia } from "./agenda";
import { type Aprobacion, registrarEjecutor, solicitar } from "./aprobaciones";
import { auditar } from "./auditoria";
import { aCop, aEur, dia, type Moneda, moneda, monto } from "./dinero";
import { exigir, puede } from "./guardia";
import { plata } from "./formato";
import { copPor, tasasDelDia } from "./tasas";

/**
 * Cobros (spec §4): lo que un cliente debe y cuándo. Cada cobro guarda la
 * tasa del día en que se creó; al marcarlo pagado se fija la del día del
 * pago, que es la que cuenta como ingreso del mes.
 *
 * - Por Stripe (EUR o USD): se crea también el enlace /pay/… de siempre; el
 *   webhook de Stripe lo marca pagado solo.
 * - Por transferencia o efectivo (cualquier moneda): se marca pagado a mano.
 * - Un agente (solo `cobros:borrador`) no crea cobros: deja la solicitud en
 *   Aprobaciones con el monto exacto y un humano la aprueba.
 */
export const CONCEPTOS_COBRO = ["arranque", "cuota", "mensualidad", "otro"] as const;
export const METODOS = ["stripe", "transferencia", "efectivo"] as const;
export type Metodo = (typeof METODOS)[number];

export type Cobro = {
  id: number;
  empresa_id: number;
  empresa: string;
  persona_id: number | null;
  persona: string | null;
  correo: string | null;
  suscripcion_id: number | null;
  concepto: (typeof CONCEPTOS_COBRO)[number];
  descripcion: string | null;
  valor: string;
  moneda: Moneda;
  tasa_eur: string;
  tasa_cop: string;
  vence_at: string;
  pagado_at: string | null;
  metodo: Metodo;
  payment_link_id: string | null;
  estado: "pendiente" | "pagado" | "anulado";
  motivo_anulacion: string | null;
  creado_por: number | null;
  created_at: string;
  /** Calculados: pendiente y vencido; valor en pesos con la tasa guardada; enlace de pago. */
  mora: boolean;
  dias_mora: number;
  valor_cop: number;
  enlace_pago: string | null;
  recibo: string | null;
};

const SITIO = () => process.env.NEXT_PUBLIC_SITE_URL || "https://calidev.dev";

/** La tabla de enlaces de pago la creaba solo /api/admin/seed; el CRM no depende de eso. */
let pagosListos: Promise<void> | null = null;
export function asegurarPagos(): Promise<void> {
  pagosListos ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS payment_links (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_email TEXT,
        client_address TEXT,
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        currency TEXT DEFAULT 'EUR',
        status TEXT DEFAULT 'pending',
        stripe_session_id TEXT,
        receipt_number TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ
      )`;
  })().catch((e) => {
    pagosListos = null;
    throw e;
  });
  return pagosListos;
}

type Fila = Omit<Cobro, "mora" | "dias_mora" | "valor_cop" | "enlace_pago" | "recibo"> & { recibo: string | null };

function completar(f: Fila, hoy: string): Cobro {
  const dias = f.estado === "pendiente" && f.vence_at < hoy ? Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${f.vence_at}T12:00:00Z`)) / 86_400_000) : 0;
  return {
    ...f,
    mora: dias > 0,
    dias_mora: dias,
    valor_cop: aCop(f.valor, f.tasa_cop),
    enlace_pago: f.payment_link_id ? `${SITIO()}/pay/${f.payment_link_id}` : null,
    recibo: f.recibo ? `${SITIO()}/receipt/${f.payment_link_id}` : null,
  };
}

async function filas(where: { id?: number; estado?: string | null; mora?: boolean; empresaId?: number | null; suscripcionId?: number | null; venceHasta?: string | null; limite?: number }, hoy: string): Promise<Cobro[]> {
  await asegurarPagos();
  const lim = Math.min(Math.max(where.limite ?? 200, 1), 1000);
  const r = await sql<Fila>`
    SELECT c.id, c.empresa_id, e.nombre AS empresa, c.persona_id, p.nombre AS persona, p.correo, c.suscripcion_id, c.concepto,
      c.descripcion, c.valor, c.moneda, c.tasa_eur, c.tasa_cop, c.vence_at::text AS vence_at, c.pagado_at, c.metodo,
      c.payment_link_id, c.estado, c.motivo_anulacion, c.creado_por, c.created_at, pl.receipt_number AS recibo
    FROM crm_cobros c JOIN crm_empresas e ON e.id = c.empresa_id LEFT JOIN crm_personas p ON p.id = c.persona_id
    LEFT JOIN payment_links pl ON pl.id = c.payment_link_id
    WHERE (${where.id ?? null}::int IS NULL OR c.id = ${where.id ?? null})
      AND (${where.estado ?? null}::text IS NULL OR c.estado = ${where.estado ?? null})
      AND (${!!where.mora} = FALSE OR (c.estado = 'pendiente' AND c.vence_at < ${hoy}::date))
      AND (${where.empresaId ?? null}::int IS NULL OR c.empresa_id = ${where.empresaId ?? null})
      AND (${where.suscripcionId ?? null}::int IS NULL OR c.suscripcion_id = ${where.suscripcionId ?? null})
      AND (${where.venceHasta ?? null}::date IS NULL OR c.vence_at <= ${where.venceHasta ?? null}::date)
    ORDER BY c.vence_at ASC, c.id ASC LIMIT ${lim}`;
  return r.rows.map((f) => completar(f, hoy));
}

export async function cobroPorId(actor: Actor | null, id: number, ahora = new Date()): Promise<Cobro> {
  if (actor) exigir(actor, "finanzas:leer");
  const c = (await filas({ id }, diaColombia(null, ahora).dia))[0];
  if (!c) throw new ErrorCrm(404, "no_existe", `No hay cobro ${id}.`);
  return c;
}

export async function listarCobros(actor: Actor, f: { estado?: string | null; mora?: boolean; empresaId?: number | null; suscripcionId?: number | null; limite?: number } = {}, ahora = new Date()): Promise<Cobro[]> {
  exigir(actor, "finanzas:leer");
  const estado = f.estado === "todos" ? null : (f.estado ?? null);
  if (estado && !["pendiente", "pagado", "anulado"].includes(estado)) throw new ErrorCrm(400, "campo_invalido", "estado: pendiente, pagado, anulado o todos.", "estado");
  return filas({ ...f, estado }, diaColombia(null, ahora).dia);
}

/** Pendientes que vencen hasta dentro de `dias` días, incluidos los ya vencidos (para Hoy). */
export async function cobrosQueVencen(dias = 7, ahora = new Date()): Promise<Cobro[]> {
  const hoy = diaColombia(null, ahora).dia;
  const hasta = new Date(Date.parse(`${hoy}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
  return filas({ estado: "pendiente", venceHasta: hasta, limite: 50 }, hoy);
}

export type NuevoCobro = {
  empresaId?: unknown;
  personaId?: unknown;
  suscripcionId?: unknown;
  concepto?: unknown;
  descripcion?: unknown;
  valor?: unknown;
  moneda?: unknown;
  venceAt?: unknown;
  metodo?: unknown;
  tasaEur?: unknown;
  tasaUsd?: unknown;
};

type Validado = {
  empresaId: number;
  empresa: string;
  personaId: number | null;
  persona: string | null;
  correo: string | null;
  suscripcionId: number | null;
  concepto: (typeof CONCEPTOS_COBRO)[number];
  descripcion: string | null;
  valor: number;
  moneda: Moneda;
  venceAt: string;
  metodo: Metodo;
  tasaEur: number | null;
  tasaUsd: number | null;
};

const id = (v: unknown, campo: string): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser un id.`, campo);
  return n;
};

/** Valida todo y resuelve nombres; no escribe nada. */
export async function validarCobro(d: NuevoCobro): Promise<Validado> {
  let empresaId = id(d.empresaId, "empresa_id");
  const personaId = id(d.personaId, "persona_id");
  const suscripcionId = id(d.suscripcionId, "suscripcion_id");
  let persona: { nombre: string; correo: string | null; empresa_id: number | null } | undefined;
  if (personaId) {
    persona = (await sql<{ nombre: string; correo: string | null; empresa_id: number | null }>`SELECT nombre, correo, empresa_id FROM crm_personas WHERE id = ${personaId}`).rows[0];
    if (!persona) throw new ErrorCrm(404, "no_existe", `No hay persona ${personaId}.`, "persona_id");
  }
  if (suscripcionId) {
    const s = (await sql<{ empresa_id: number }>`SELECT empresa_id FROM crm_suscripciones WHERE id = ${suscripcionId}`).rows[0];
    if (!s) throw new ErrorCrm(404, "no_existe", `No hay suscripción ${suscripcionId}.`, "suscripcion_id");
    if (empresaId && empresaId !== s.empresa_id) throw new ErrorCrm(400, "campo_invalido", "La suscripción es de otra empresa.", "suscripcion_id");
    empresaId = s.empresa_id;
  }
  empresaId ??= persona?.empresa_id ?? null;
  if (!empresaId) throw new ErrorCrm(400, "campo_requerido", "El cobro necesita la empresa (empresa_id) o una persona con empresa.", "empresa_id");
  const e = (await sql<{ nombre: string }>`SELECT nombre FROM crm_empresas WHERE id = ${empresaId}`).rows[0];
  if (!e) throw new ErrorCrm(404, "no_existe", `No hay empresa ${empresaId}.`, "empresa_id");

  const concepto = (d.concepto ?? "otro") as Validado["concepto"];
  if (!(CONCEPTOS_COBRO as readonly string[]).includes(concepto)) throw new ErrorCrm(400, "campo_invalido", "concepto: arranque, cuota, mensualidad u otro.", "concepto");
  const m = moneda(d.moneda ?? "COP");
  const metodo = (d.metodo ?? (m === "COP" ? "transferencia" : "stripe")) as Metodo;
  if (!(METODOS as readonly string[]).includes(metodo)) throw new ErrorCrm(400, "campo_invalido", "metodo: stripe, transferencia o efectivo.", "metodo");
  if (metodo === "stripe" && m === "COP") throw new ErrorCrm(400, "campo_invalido", "Stripe cobra en EUR o USD. En pesos, usa transferencia.", "metodo");
  const descripcion = typeof d.descripcion === "string" && d.descripcion.trim() ? d.descripcion.trim().slice(0, 300) : null;
  if (metodo === "stripe" && !descripcion) throw new ErrorCrm(400, "campo_requerido", "Por Stripe la descripción es obligatoria: es lo que el cliente ve al pagar.", "descripcion");
  return {
    empresaId,
    empresa: e.nombre,
    personaId,
    persona: persona?.nombre ?? null,
    correo: persona?.correo ?? null,
    suscripcionId,
    concepto,
    descripcion,
    valor: monto(d.valor, "valor", { requerido: true, positivo: true })!,
    moneda: m,
    venceAt: dia(d.venceAt, "vence_at", { requerido: true })!,
    metodo,
    tasaEur: monto(d.tasaEur, "tasa_eur", { positivo: true }),
    tasaUsd: monto(d.tasaUsd, "tasa_usd", { positivo: true }),
  };
}

/** Sin chequeo de permiso: lo usan crearCobro, el ejecutor de la aprobación y el alta de cliente. */
export async function insertarCobro(actor: Actor | null, v: Validado, ahora = new Date()): Promise<Cobro> {
  const t = await tasasDelDia(null, { eur: v.tasaEur, usd: v.tasaUsd }, ahora);
  let link: string | null = null;
  if (v.metodo === "stripe") {
    await asegurarPagos();
    link = `pay_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    await savePaymentLink({
      id: link,
      client_name: v.persona ? `${v.persona} · ${v.empresa}` : v.empresa,
      client_email: v.correo ?? undefined,
      description: v.descripcion!,
      amount: v.valor,
      currency: v.moneda as "EUR" | "USD",
      status: "pending",
      created_at: ahora.toISOString(),
    });
  }
  const r = await sql<{ id: number }>`
    INSERT INTO crm_cobros (empresa_id, persona_id, suscripcion_id, concepto, descripcion, valor, moneda, tasa_eur, tasa_cop,
      vence_at, metodo, payment_link_id, creado_por)
    VALUES (${v.empresaId}, ${v.personaId}, ${v.suscripcionId}, ${v.concepto}, ${v.descripcion}, ${v.valor}, ${v.moneda},
      ${t.eur}, ${copPor(v.moneda, t)}, ${v.venceAt}, ${v.metodo}, ${link}, ${actor?.usuario.id ?? null})
    RETURNING id`;
  const c = await cobroPorId(null, r.rows[0].id, ahora);
  await auditar(actor, "crear", "cobro", c.id, null, { ...c, fuente_tasa: t.fuente });
  return c;
}

export const vistaPreviaCobro = (v: Validado) =>
  `Cobro de ${plata(v.valor, v.moneda)} ${v.moneda} a ${v.empresa}${v.persona ? ` (${v.persona}${v.correo ? `, ${v.correo}` : ""})` : ""}` +
  ` · ${v.concepto}${v.descripcion ? `: ${v.descripcion}` : ""} · vence ${v.venceAt} · por ${v.metodo}` +
  (v.metodo === "stripe" ? " (se crea el enlace de pago; no se envía a nadie)" : "");

export type ResultadoCobro = { estado: "creado"; cobro: Cobro } | { estado: "pendiente"; aprobacion: Aprobacion };

/**
 * Con `cobros:crear`, el cobro queda creado ya. Con solo `cobros:borrador`
 * (los agentes) va a Aprobaciones y responde 202.
 */
export async function crearCobro(actor: Actor, d: NuevoCobro, ahora = new Date()): Promise<ResultadoCobro> {
  if (!puede(actor, "cobros:crear") && !puede(actor, "cobros:borrador")) exigir(actor, "cobros:crear");
  const v = await validarCobro(d);
  if (puede(actor, "cobros:crear")) return { estado: "creado", cobro: await insertarCobro(actor, v, ahora) };
  const payload: Record<string, unknown> = {
    empresa_id: v.empresaId, persona_id: v.personaId, suscripcion_id: v.suscripcionId, concepto: v.concepto,
    descripcion: v.descripcion, valor: v.valor, moneda: v.moneda, vence_at: v.venceAt, metodo: v.metodo,
  };
  if (v.tasaEur) payload.tasa_eur = v.tasaEur;
  if (v.tasaUsd) payload.tasa_usd = v.tasaUsd;
  const aprobacion = await solicitar(actor, { tipo: "crear_cobro", payload, vistaPrevia: vistaPreviaCobro(v), entidad: "empresa", entidadId: v.empresaId });
  return { estado: "pendiente", aprobacion };
}

const desdePayload = (p: Record<string, unknown>): NuevoCobro => ({
  empresaId: p.empresa_id, personaId: p.persona_id, suscripcionId: p.suscripcion_id, concepto: p.concepto, descripcion: p.descripcion,
  valor: p.valor, moneda: p.moneda, venceAt: p.vence_at, metodo: p.metodo, tasaEur: p.tasa_eur, tasaUsd: p.tasa_usd,
});

// Al aprobarse, se revalida el payload (quien aprueba pudo editarlo) y se crea a nombre de quien aprobó.
registrarEjecutor("crear_cobro", async (payload, aprobador) => {
  exigir(aprobador, "cobros:crear");
  const c = await insertarCobro(aprobador, await validarCobro(desdePayload(payload)));
  return { cobro_id: c.id, enlace_pago: c.enlace_pago };
});

/** Marca pagado a mano. La tasa pasa a ser la del día del pago. */
export async function registrarPago(actor: Actor, cobroId: number, d: { metodo?: unknown; pagadoAt?: unknown; tasaEur?: unknown; tasaUsd?: unknown } = {}, ahora = new Date()): Promise<Cobro> {
  exigir(actor, "finanzas:escribir");
  const antes = await cobroPorId(null, cobroId, ahora);
  if (antes.estado !== "pendiente") throw new ErrorCrm(409, "no_pendiente", `Este cobro ya está ${antes.estado}.`);
  const metodo = (d.metodo ?? (antes.metodo === "stripe" ? "transferencia" : antes.metodo)) as Metodo;
  if (!(METODOS as readonly string[]).includes(metodo)) throw new ErrorCrm(400, "campo_invalido", "metodo: stripe, transferencia o efectivo.", "metodo");
  if (metodo === "stripe" && antes.moneda === "COP") throw new ErrorCrm(400, "campo_invalido", "Stripe no cobra en pesos.", "metodo");
  const diaPago = dia(d.pagadoAt, "pagado_at") ?? diaColombia(null, ahora).dia;
  if (diaPago > diaColombia(null, ahora).dia) throw new ErrorCrm(400, "campo_invalido", "pagado_at no puede ser futuro.", "pagado_at");
  const t = await tasasDelDia(diaPago, { eur: monto(d.tasaEur, "tasa_eur", { positivo: true }), usd: monto(d.tasaUsd, "tasa_usd", { positivo: true }) }, ahora);
  // Mediodía de Colombia: el día del pago cae en el mismo mes en cualquier zona.
  const pagadoAt = diaPago === diaColombia(null, ahora).dia ? ahora.toISOString() : `${diaPago}T17:00:00.000Z`;
  const r = await sql`
    UPDATE crm_cobros SET estado = 'pagado', pagado_at = ${pagadoAt}, metodo = ${metodo}, tasa_eur = ${t.eur}, tasa_cop = ${copPor(antes.moneda, t)}
    WHERE id = ${cobroId} AND estado = 'pendiente' RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(409, "no_pendiente", "Este cobro cambió mientras tanto. Recarga.");
  const despues = await cobroPorId(null, cobroId, ahora);
  await auditar(actor, "pagar", "cobro", cobroId, { estado: antes.estado, tasa_eur: antes.tasa_eur, tasa_cop: antes.tasa_cop },
    { estado: "pagado", pagado_at: pagadoAt, metodo, tasa_eur: despues.tasa_eur, tasa_cop: despues.tasa_cop, fuente_tasa: t.fuente });
  return despues;
}

export async function anularCobro(actor: Actor, cobroId: number, motivo: unknown, ahora = new Date()): Promise<Cobro> {
  exigir(actor, "finanzas:escribir");
  const m = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
  if (!m) throw new ErrorCrm(400, "campo_requerido", "Di por qué se anula el cobro.", "motivo");
  const antes = await cobroPorId(null, cobroId, ahora);
  if (antes.estado !== "pendiente") throw new ErrorCrm(409, "no_pendiente", `Solo se anula un cobro pendiente; este está ${antes.estado}.`);
  const r = await sql`UPDATE crm_cobros SET estado = 'anulado', motivo_anulacion = ${m} WHERE id = ${cobroId} AND estado = 'pendiente' RETURNING id`;
  if (!r.rows[0]) throw new ErrorCrm(409, "no_pendiente", "Este cobro cambió mientras tanto. Recarga.");
  await auditar(actor, "anular", "cobro", cobroId, { estado: antes.estado }, { estado: "anulado", motivo: m });
  return cobroPorId(null, cobroId, ahora);
}

/**
 * Para el webhook de Stripe: marca pagado el cobro de ese enlace. Idempotente
 * (Stripe reintenta) y nunca lanza por la tasa: si no hay tasa del día, se
 * queda con la de la creación.
 */
export async function marcarPagadoPorLink(linkId: string, pagadoAt = new Date()): Promise<number | null> {
  const c = (await sql<{ id: number; moneda: Moneda; estado: string }>`SELECT id, moneda, estado FROM crm_cobros WHERE payment_link_id = ${linkId}`).rows[0];
  if (!c || c.estado !== "pendiente") return null;
  let tasas: { eur: number; cop: number } | null = null;
  try {
    const t = await tasasDelDia(diaColombia(null, pagadoAt).dia, {}, pagadoAt);
    tasas = { eur: t.eur, cop: copPor(c.moneda, t) };
  } catch {
    tasas = null;
  }
  const r = tasas
    ? await sql`UPDATE crm_cobros SET estado = 'pagado', pagado_at = ${pagadoAt.toISOString()}, metodo = 'stripe', tasa_eur = ${tasas.eur}, tasa_cop = ${tasas.cop} WHERE id = ${c.id} AND estado = 'pendiente' RETURNING id`
    : await sql`UPDATE crm_cobros SET estado = 'pagado', pagado_at = ${pagadoAt.toISOString()}, metodo = 'stripe' WHERE id = ${c.id} AND estado = 'pendiente' RETURNING id`;
  if (!r.rows[0]) return null;
  await auditar(null, "pagar", "cobro", c.id, { estado: "pendiente" }, { estado: "pagado", metodo: "stripe", enlace: linkId, tasa_eur: tasas?.eur ?? null });
  return c.id;
}

/** Valor del cobro en EUR con su tasa guardada. */
export const valorEur = (c: Pick<Cobro, "valor" | "tasa_cop" | "tasa_eur">) => aEur(c.valor, c.tasa_cop, c.tasa_eur);
