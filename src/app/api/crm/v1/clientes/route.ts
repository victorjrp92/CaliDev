import { altaCliente } from "@/lib/crm/clientes";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";

/** Alta de cliente en un paso: empresa, contacto, suscripción y cobros. */
export const POST = api(async (request) => {
  const a = await requerir(request, "cobros:crear");
  const b = await cuerpo(request);
  const contacto = b.contacto && typeof b.contacto === "object" ? (b.contacto as Record<string, unknown>) : null;
  return idempotente(a, request, async () => ({
    estado: 201,
    cuerpo: await altaCliente(a, {
      empresa: b.empresa, nit: b.nit, contacto, productoId: b.producto_id, valorArranque: b.valor_arranque, valorMensual: b.valor_mensual,
      promo: b.promo, moneda: b.moneda, personas: b.personas, permanenciaHasta: b.permanencia_hasta, inicio: b.inicio,
      cobros: Array.isArray(b.cobros) ? (b.cobros as Record<string, unknown>[]) : null, tasaEur: b.tasa_eur, tasaUsd: b.tasa_usd,
    }),
  }));
});
