import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";
import { moneda, monto } from "./dinero";
import { exigir } from "./guardia";

/**
 * Catálogo (spec §4): productos, precio publicado por concepto con vigencia y
 * promos. Cambiar un precio cierra la vigencia del anterior; el historial
 * queda para saber qué se cobraba cuando se firmó cada contrato.
 */
export const CONCEPTOS_PRECIO = ["arranque", "mensualidad", "persona_adicional"] as const;
export type ConceptoPrecio = (typeof CONCEPTOS_PRECIO)[number];

export type Precio = {
  id: number;
  producto_id: number;
  concepto: ConceptoPrecio;
  valor: string;
  moneda: string;
  incluye: string | null;
  vigente_desde: string;
  vigente_hasta: string | null;
  creado_por: number | null;
};

export type Producto = { id: number; nombre: string; descripcion: string | null; activo: boolean; created_at: string; precios: Precio[] };

export type Promo = {
  id: number;
  codigo: string;
  descripcion: string;
  producto_id: number | null;
  concepto: ConceptoPrecio;
  porcentaje: string | null;
  valor: string | null;
  vigente_desde: string;
  vigente_hasta: string | null;
  created_at: string;
};

function concepto(v: unknown): ConceptoPrecio {
  if (!(CONCEPTOS_PRECIO as readonly unknown[]).includes(v)) throw new ErrorCrm(400, "campo_invalido", "concepto: arranque, mensualidad o persona_adicional.", "concepto");
  return v as ConceptoPrecio;
}

function nombre(v: unknown, requerido: boolean): string | null {
  if (v === undefined || v === null || v === "") {
    if (requerido) throw new ErrorCrm(400, "campo_requerido", "El producto necesita un nombre.", "nombre");
    return null;
  }
  if (typeof v !== "string" || !v.trim() || v.trim().length > 120) throw new ErrorCrm(400, "campo_invalido", "nombre: texto de hasta 120 caracteres.", "nombre");
  return v.trim();
}

const esDuplicado = (e: unknown) => (e as { code?: string })?.code === "23505";

/** Precios vigentes (o todos con `historial`) de unos productos. */
async function preciosDe(ids: number[], historial: boolean): Promise<Precio[]> {
  if (!ids.length) return [];
  const r = await sql<Precio>`
    SELECT * FROM crm_precios WHERE producto_id = ANY(${ids}::int[]) AND (${historial} OR vigente_hasta IS NULL)
    ORDER BY producto_id, concepto, vigente_desde DESC, id DESC`;
  return r.rows;
}

export async function listarProductos(actor: Actor, f: { todos?: boolean } = {}): Promise<Producto[]> {
  exigir(actor, "finanzas:leer");
  const r = await sql<Omit<Producto, "precios">>`
    SELECT * FROM crm_productos WHERE (${!!f.todos} OR activo) ORDER BY activo DESC, nombre`;
  const precios = await preciosDe(r.rows.map((p) => p.id), false);
  return r.rows.map((p) => ({ ...p, precios: precios.filter((x) => x.producto_id === p.id) }));
}

/** Producto con su historial de precios completo. */
export async function productoPorId(actor: Actor | null, id: number): Promise<Producto> {
  if (actor) exigir(actor, "finanzas:leer");
  const r = await sql<Omit<Producto, "precios">>`SELECT * FROM crm_productos WHERE id = ${id}`;
  if (!r.rows[0]) throw new ErrorCrm(404, "no_existe", `No hay producto ${id}.`);
  return { ...r.rows[0], precios: await preciosDe([id], true) };
}

export async function productoPorNombre(n: string): Promise<{ id: number } | null> {
  const r = await sql<{ id: number }>`SELECT id FROM crm_productos WHERE lower(nombre) = lower(${n})`;
  return r.rows[0] ?? null;
}

/** El precio vigente de un concepto, o null si el producto no lo publica. */
export async function precioVigente(productoId: number, c: ConceptoPrecio): Promise<Precio | null> {
  const r = await sql<Precio>`SELECT * FROM crm_precios WHERE producto_id = ${productoId} AND concepto = ${c} AND vigente_hasta IS NULL`;
  return r.rows[0] ?? null;
}

export async function crearProducto(actor: Actor, d: { nombre?: unknown; descripcion?: unknown }): Promise<Producto> {
  exigir(actor, "finanzas:escribir");
  const n = nombre(d.nombre, true)!;
  const desc = typeof d.descripcion === "string" && d.descripcion.trim() ? d.descripcion.trim().slice(0, 1000) : null;
  try {
    const r = await sql<{ id: number }>`INSERT INTO crm_productos (nombre, descripcion) VALUES (${n}, ${desc}) RETURNING id`;
    const p = await productoPorId(null, r.rows[0].id);
    await auditar(actor, "crear", "producto", p.id, null, p);
    return p;
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorCrm(409, "duplicado", `Ya hay un producto llamado «${n}».`, "nombre");
    throw e;
  }
}

export async function editarProducto(actor: Actor, id: number, d: { nombre?: unknown; descripcion?: unknown; activo?: unknown }): Promise<Producto> {
  exigir(actor, "finanzas:escribir");
  const antes = await productoPorId(null, id);
  const n = "nombre" in d ? nombre(d.nombre, true)! : antes.nombre;
  const desc = "descripcion" in d ? (typeof d.descripcion === "string" && d.descripcion.trim() ? d.descripcion.trim().slice(0, 1000) : null) : antes.descripcion;
  if ("activo" in d && typeof d.activo !== "boolean") throw new ErrorCrm(400, "campo_invalido", "activo: true o false.", "activo");
  const activo = "activo" in d ? (d.activo as boolean) : antes.activo;
  try {
    await sql`UPDATE crm_productos SET nombre = ${n}, descripcion = ${desc}, activo = ${activo} WHERE id = ${id}`;
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorCrm(409, "duplicado", `Ya hay un producto llamado «${n}».`, "nombre");
    throw e;
  }
  const despues = await productoPorId(null, id);
  await auditar(actor, "editar", "producto", id, { nombre: antes.nombre, descripcion: antes.descripcion, activo: antes.activo }, { nombre: n, descripcion: desc, activo });
  return despues;
}

/**
 * Publica un precio nuevo para un concepto: cierra el vigente y abre este.
 * Sin transacciones, el índice único parcial evita dos vigentes a la vez: si
 * dos personas cambian el mismo precio al mismo tiempo, la segunda recibe 409.
 */
export async function fijarPrecio(actor: Actor, productoId: number, d: { concepto?: unknown; valor?: unknown; moneda?: unknown; incluye?: unknown }): Promise<Producto> {
  exigir(actor, "precio:fijar");
  await productoPorId(null, productoId);
  const c = concepto(d.concepto);
  const v = monto(d.valor, "valor", { requerido: true })!;
  const m = moneda(d.moneda ?? "COP");
  const incluye = typeof d.incluye === "string" && d.incluye.trim() ? d.incluye.trim().slice(0, 300) : null;
  const antes = await precioVigente(productoId, c);
  if (antes && Number(antes.valor) === v && antes.moneda === m && (antes.incluye ?? null) === incluye) return productoPorId(null, productoId);
  if (antes) await sql`UPDATE crm_precios SET vigente_hasta = NOW() WHERE id = ${antes.id} AND vigente_hasta IS NULL`;
  try {
    await sql`
      INSERT INTO crm_precios (producto_id, concepto, valor, moneda, incluye, creado_por)
      VALUES (${productoId}, ${c}, ${v}, ${m}, ${incluye}, ${actor.usuario.id})`;
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorCrm(409, "cambio_concurrente", "Alguien cambió este precio al mismo tiempo. Recarga y revisa.");
    throw e;
  }
  await auditar(actor, "fijar_precio", "producto", productoId, antes && { concepto: c, valor: antes.valor, moneda: antes.moneda }, { concepto: c, valor: v, moneda: m, incluye });
  return productoPorId(null, productoId);
}

export async function listarPromos(actor: Actor, f: { vigentes?: boolean } = {}): Promise<Promo[]> {
  exigir(actor, "finanzas:leer");
  const r = await sql<Promo>`
    SELECT * FROM crm_promos
    WHERE (${!f.vigentes} OR (vigente_desde <= NOW() AND (vigente_hasta IS NULL OR vigente_hasta > NOW())))
    ORDER BY created_at DESC, id DESC`;
  return r.rows;
}

export async function crearPromo(actor: Actor, d: Record<string, unknown>): Promise<Promo> {
  exigir(actor, "precio:fijar");
  const codigo = typeof d.codigo === "string" ? d.codigo.trim().toLowerCase() : "";
  if (!/^[a-z0-9_-]{2,40}$/.test(codigo)) throw new ErrorCrm(400, "campo_invalido", "codigo: 2 a 40 letras, números, - o _ (p. ej. captura).", "codigo");
  const descripcion = typeof d.descripcion === "string" ? d.descripcion.trim().slice(0, 300) : "";
  if (!descripcion) throw new ErrorCrm(400, "campo_requerido", "descripcion: qué descuento es, en una línea.", "descripcion");
  const c = concepto(d.concepto ?? "arranque");
  const pct = monto(d.porcentaje, "porcentaje", { positivo: true });
  const val = monto(d.valor, "valor", { positivo: true });
  if ((pct === null) === (val === null)) throw new ErrorCrm(400, "campo_invalido", "Pon porcentaje o valor fijo, uno de los dos.", "porcentaje");
  if (pct !== null && pct > 100) throw new ErrorCrm(400, "campo_invalido", "porcentaje: hasta 100.", "porcentaje");
  const productoId = d.producto_id == null ? null : Number(d.producto_id);
  if (productoId !== null) await productoPorId(null, productoId);
  const hasta = typeof d.vigente_hasta === "string" && d.vigente_hasta ? d.vigente_hasta : null;
  if (hasta && Number.isNaN(Date.parse(hasta))) throw new ErrorCrm(400, "campo_invalido", "vigente_hasta: una fecha.", "vigente_hasta");
  try {
    const r = await sql<Promo>`
      INSERT INTO crm_promos (codigo, descripcion, producto_id, concepto, porcentaje, valor, vigente_hasta)
      VALUES (${codigo}, ${descripcion}, ${productoId}, ${c}, ${pct}, ${val}, ${hasta}) RETURNING *`;
    await auditar(actor, "crear", "promo", r.rows[0].id, null, r.rows[0]);
    return r.rows[0];
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorCrm(409, "duplicado", `Ya hay una promo con el código «${codigo}».`, "codigo");
    throw e;
  }
}

/** La promo vigente con ese código, o 400 si no existe o venció. */
export async function promoVigente(codigo: string, productoId?: number | null): Promise<Promo> {
  const r = await sql<Promo>`
    SELECT * FROM crm_promos WHERE lower(codigo) = lower(${codigo.trim()})
      AND vigente_desde <= NOW() AND (vigente_hasta IS NULL OR vigente_hasta > NOW())`;
  const p = r.rows[0];
  if (!p) throw new ErrorCrm(400, "campo_invalido", `No hay una promo vigente con el código «${codigo}».`, "promo");
  if (productoId && p.producto_id && p.producto_id !== productoId) throw new ErrorCrm(400, "campo_invalido", `La promo «${codigo}» es de otro producto.`, "promo");
  return p;
}

/** Valor con la promo aplicada (nunca negativo), redondeado al peso/céntimo. */
export function aplicarPromo(valor: number, p: Pick<Promo, "porcentaje" | "valor">): number {
  const r = p.porcentaje !== null ? valor * (1 - Number(p.porcentaje) / 100) : valor - Number(p.valor);
  return Math.max(0, Math.round(r * 100) / 100);
}
