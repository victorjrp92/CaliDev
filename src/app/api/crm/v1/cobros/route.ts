import { crearCobro, listarCobros } from "@/lib/crm/cobros";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  const q = consulta(request);
  return ok({
    cobros: await listarCobros(a, {
      estado: q.texto("estado"), mora: q.si("mora"), empresaId: q.entero("empresa_id"), suscripcionId: q.entero("suscripcion_id"), limite: q.entero("limite") ?? 200,
    }),
  });
});

/** Con cobros:crear queda creado (201); un agente (cobros:borrador) lo deja en Aprobaciones (202). */
export const POST = api(async (request) => {
  const a = await requerir(request, "cobros:borrador");
  const b = await cuerpo(request);
  return idempotente(a, request, async () => {
    const r = await crearCobro(a, {
      empresaId: b.empresa_id, personaId: b.persona_id, suscripcionId: b.suscripcion_id, concepto: b.concepto, descripcion: b.descripcion,
      valor: b.valor, moneda: b.moneda, venceAt: b.vence_at, metodo: b.metodo, tasaEur: b.tasa_eur, tasaUsd: b.tasa_usd,
    });
    return { estado: r.estado === "creado" ? 201 : 202, cuerpo: r };
  });
});
