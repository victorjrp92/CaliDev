import { borrarContratoCrm, contratoCrm } from "@/lib/crm/contratos";
import { api, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";

type P = { id: string };

export const GET = api<P>(async (request, ctx) => {
  const a = await requerir(request, "contratos:leer");
  return ok({ contrato: await contratoCrm(a, idDe((await ctx.params).id)) });
});

/** Solo si nadie ha firmado. */
export const DELETE = api<P>(async (request, ctx) => {
  const a = await requerir(request, "contratos:escribir");
  const id = idDe((await ctx.params).id);
  return idempotente(a, request, async () => {
    await borrarContratoCrm(a, id);
    return { estado: 200, cuerpo: { borrado: id } };
  });
});
