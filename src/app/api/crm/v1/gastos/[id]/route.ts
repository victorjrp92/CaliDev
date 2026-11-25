import { borrarGasto } from "@/lib/crm/gastos";
import { api, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";

export const DELETE = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:escribir");
  const id = idDe((await ctx.params).id);
  await borrarGasto(a, id);
  return ok({ borrado: id });
});
