import { api, puede, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";
import { revocarClave } from "@/lib/crm/usuarios";

export const DELETE = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "claves:propias");
  await revocarClave(a, idDe((await ctx.params).id), puede(a, "claves:gestionar"));
  return ok({ ok: true });
});
