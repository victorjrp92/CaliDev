import { crearGasto, listarGastos } from "@/lib/crm/gastos";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  const q = consulta(request);
  return ok({ gastos: await listarGastos(a, { desde: q.texto("desde"), hasta: q.texto("hasta"), empresaId: q.entero("empresa_id") }) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "finanzas:escribir");
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { gasto: await crearGasto(a, b) } }));
});
