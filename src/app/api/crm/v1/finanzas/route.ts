import { resumen } from "@/lib/crm/finanzas";
import { api, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  return ok({ resumen: await resumen(a, { mes: consulta(request).texto("mes") }) });
});
