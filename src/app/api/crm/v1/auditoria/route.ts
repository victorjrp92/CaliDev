import { listarAuditoria } from "@/lib/crm/auditoria";
import { api, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

export const GET = api(async (request) => {
  await requerir(request, "auditoria:leer");
  const q = consulta(request);
  return ok({ auditoria: await listarAuditoria({ entidad: q.texto("entidad") ?? undefined, id: q.texto("id") ?? undefined, limite: q.entero("limite") ?? 50 }) });
});
