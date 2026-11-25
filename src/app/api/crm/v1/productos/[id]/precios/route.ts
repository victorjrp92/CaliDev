import { fijarPrecio } from "@/lib/crm/catalogo";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe } from "@/lib/crm/http";

/** Nuevo precio de un concepto: cierra el vigente y abre este desde hoy. */
export const POST = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "precio:fijar");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({
    estado: 201,
    cuerpo: { producto: await fijarPrecio(a, id, { concepto: b.concepto, valor: b.valor, moneda: b.moneda, incluye: b.incluye }) },
  }));
});
