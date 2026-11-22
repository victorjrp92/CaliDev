import { ErrorCrm } from "@/lib/crm/actor";
import { aprobacionPorId } from "@/lib/crm/aprobaciones";
import { api, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";

export const GET = api<{ id: string }>(async (request, ctx) => {
  await requerir(request, "aprobaciones:leer");
  const id = idDe((await ctx.params).id);
  const aprobacion = await aprobacionPorId(id);
  if (!aprobacion) throw new ErrorCrm(404, "no_existe", `No hay aprobación ${id}.`);
  return ok({ aprobacion });
});
