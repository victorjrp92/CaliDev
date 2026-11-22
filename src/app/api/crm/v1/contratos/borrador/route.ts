import { ErrorCrm } from "@/lib/crm/actor";
import { borradorDesdeOportunidad } from "@/lib/crm/contratos";
import { api, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

/** Los datos de la plantilla ya llenos desde la oportunidad. No crea nada. */
export const GET = api(async (request) => {
  const a = await requerir(request, "contratos:leer");
  const id = consulta(request).entero("oportunidad_id");
  if (!id) throw new ErrorCrm(400, "campo_requerido", "Falta ?oportunidad_id=.", "oportunidad_id");
  return ok({ borrador: await borradorDesdeOportunidad(a, id) });
});
