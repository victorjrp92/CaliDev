import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";
import { crearSuscripcion, listarSuscripciones } from "@/lib/crm/suscripciones";

export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  const q = consulta(request);
  return ok({ suscripciones: await listarSuscripciones(a, { estado: q.texto("estado"), empresaId: q.entero("empresa_id") }) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "finanzas:escribir");
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({
    estado: 201,
    cuerpo: {
      suscripcion: await crearSuscripcion(a, {
        empresaId: b.empresa_id, personaId: b.persona_id, productoId: b.producto_id, oportunidadId: b.oportunidad_id, contratoId: b.contrato_id,
        valorArranque: b.valor_arranque, valorMensual: b.valor_mensual, moneda: b.moneda, personas: b.personas,
        permanenciaHasta: b.permanencia_hasta, inicio: b.inicio,
      }),
    },
  }));
});
