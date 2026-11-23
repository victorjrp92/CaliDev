import { contratoPorId } from "@/lib/contratos/datos";
import { borrarContratoCrm, contratoCrm } from "@/lib/crm/contratos";
import { api, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";

type P = { id: string };

export const GET = api<P>(async (request, ctx) => {
  const a = await requerir(request, "contratos:leer");
  const id = idDe((await ctx.params).id);
  const c = await contratoCrm(a, id);
  // El correo que le llega a quien firma cuando firman todos, si el contrato lo trae.
  let alFirmar: unknown = null;
  try {
    const datos = (await contratoPorId(id))?.datos;
    alFirmar = datos ? ((JSON.parse(datos) as { alFirmar?: unknown }).alFirmar ?? null) : null;
  } catch {}
  return ok({ contrato: { ...c, al_firmar: alFirmar } });
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
