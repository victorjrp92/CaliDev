import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";
import { aplicarPromo, precioVigente, productoPorId, productoPorNombre, promoVigente } from "./catalogo";
import { type Cobro, insertarCobro, validarCobro } from "./cobros";
import { dia, moneda, monto } from "./dinero";
import { exigir } from "./guardia";
import { crearPersona, type Persona } from "./personas";
import { insertarSuscripcion, type Suscripcion } from "./suscripciones";

/**
 * Alta de cliente (spec §4) en un solo paso: empresa y contacto, la
 * suscripción con el precio pactado y los cobros acordados. Todo se valida
 * antes de escribir; si algo falla a mitad (p. ej. la base), lo ya creado
 * queda y el error dice qué faltó.
 */
export type CobroAlta = { concepto?: unknown; valor?: unknown; vence?: unknown; metodo?: unknown; descripcion?: unknown };

export type Alta = {
  empresa?: unknown;
  nit?: unknown;
  contacto?: { nombre?: unknown; correo?: unknown; whatsapp?: unknown } | null;
  productoId?: unknown;
  valorArranque?: unknown;
  valorMensual?: unknown;
  promo?: unknown;
  moneda?: unknown;
  personas?: unknown;
  permanenciaHasta?: unknown;
  inicio?: unknown;
  cobros?: CobroAlta[] | null;
  tasaEur?: unknown;
  tasaUsd?: unknown;
};

export type ResultadoAlta = { persona: Persona; suscripcion: Suscripcion; cobros: Cobro[]; promo: string | null };

export async function altaCliente(actor: Actor, d: Alta, ahora = new Date()): Promise<ResultadoAlta> {
  exigir(actor, "finanzas:escribir");
  exigir(actor, "cobros:crear");
  const empresa = typeof d.empresa === "string" ? d.empresa.trim().slice(0, 200) : "";
  if (!empresa) throw new ErrorCrm(400, "campo_requerido", "Falta el nombre de la empresa.", "empresa");
  const nit = typeof d.nit === "string" && d.nit.trim() ? d.nit.trim().slice(0, 40) : null;
  const contacto = d.contacto ?? {};
  if (typeof contacto.nombre !== "string" || !contacto.nombre.trim()) throw new ErrorCrm(400, "campo_requerido", "Falta el nombre del contacto.", "contacto.nombre");

  const productoId = d.productoId == null || d.productoId === "" ? (await productoPorNombre("ServiNomic"))?.id : Number(d.productoId);
  if (!productoId) throw new ErrorCrm(400, "campo_requerido", "Falta el producto.", "producto_id");
  const producto = await productoPorId(null, productoId);
  const m = moneda(d.moneda ?? "COP");

  // Sin valor, el precio publicado vigente (si está en la misma moneda).
  const publicado = async (c: "arranque" | "mensualidad") => {
    const p = await precioVigente(productoId, c);
    return p && p.moneda === m ? Number(p.valor) : null;
  };
  let arranque = monto(d.valorArranque, "valor_arranque") ?? (await publicado("arranque"));
  const mensual = monto(d.valorMensual, "valor_mensual") ?? (await publicado("mensualidad"));
  if (mensual === null) throw new ErrorCrm(400, "campo_requerido", `${producto.nombre} no tiene mensualidad publicada en ${m}: pon valor_mensual.`, "valor_mensual");
  let promo: string | null = null;
  if (typeof d.promo === "string" && d.promo.trim()) {
    const p = await promoVigente(d.promo, productoId);
    if (p.concepto !== "arranque") throw new ErrorCrm(400, "campo_invalido", "El alta solo aplica promos sobre el arranque.", "promo");
    if (arranque === null) throw new ErrorCrm(400, "campo_invalido", "No hay arranque al que aplicar la promo.", "promo");
    arranque = aplicarPromo(arranque, p);
    promo = p.codigo;
  }
  const personas = d.personas == null || d.personas === "" ? null : Number(d.personas);
  if (personas !== null && (!Number.isInteger(personas) || personas < 0)) throw new ErrorCrm(400, "campo_invalido", "personas: un número entero.", "personas");
  const permanencia = dia(d.permanenciaHasta, "permanencia_hasta");
  const inicio = dia(d.inicio, "inicio");

  const cobros = Array.isArray(d.cobros) ? d.cobros : [];
  if (cobros.length > 24) throw new ErrorCrm(400, "campo_invalido", "Hasta 24 cobros por alta.", "cobros");
  // Validación previa de cada cobro sin empresa todavía: se revalida con ella al crearlo.
  for (const [i, c] of cobros.entries()) {
    try {
      monto(c.valor, "valor", { requerido: true, positivo: true });
      dia(c.vence, "vence", { requerido: true });
    } catch (e) {
      if (e instanceof ErrorCrm) throw new ErrorCrm(e.estado, e.codigo, `Cobro ${i + 1}: ${e.message}`, `cobros.${i}.${e.campo ?? ""}`);
      throw e;
    }
  }

  const persona = await crearPersona(actor, { nombre: contacto.nombre, correo: contacto.correo as string | null, whatsapp: contacto.whatsapp as string | null, empresa, origen: "alta_cliente" });
  const empresaId = persona.empresa_id!;
  if (nit) await sql`UPDATE crm_empresas SET nit = ${nit}, updated_at = NOW() WHERE id = ${empresaId} AND (nit IS NULL OR nit = '')`;
  const { suscripcion } = await insertarSuscripcion(actor, {
    empresaId, personaId: persona.id, productoId, valorArranque: arranque, valorMensual: mensual, moneda: m,
    personas, permanenciaHasta: permanencia, inicio,
  }, ahora);
  const creados: Cobro[] = [];
  for (const c of cobros) {
    const v = await validarCobro({
      empresaId, personaId: persona.id, suscripcionId: suscripcion.id, concepto: c.concepto ?? "cuota", valor: c.valor, moneda: m,
      venceAt: c.vence, metodo: c.metodo, descripcion: c.descripcion ?? `${producto.nombre} · ${String(c.concepto ?? "cuota")}`,
      tasaEur: d.tasaEur, tasaUsd: d.tasaUsd,
    });
    creados.push(await insertarCobro(actor, v, ahora));
  }
  await auditar(actor, "alta_cliente", "empresa", empresaId, null, { persona_id: persona.id, suscripcion_id: suscripcion.id, cobros: creados.map((c) => c.id), promo });
  return { persona, suscripcion, cobros: creados, promo };
}
