import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";
import { editarSuscripcion, suscripcionPorId } from "@/lib/crm/suscripciones";

export const GET = api<{ id: string }>(async (request, ctx) => {
  await requerir(request, "finanzas:leer");
  return ok({ suscripcion: await suscripcionPorId(null, idDe((await ctx.params).id)) });
});

/** Estado, personas o permanencia; cambiar valores o moneda pide además precio:fijar. */
export const PATCH = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({ estado: 200, cuerpo: { suscripcion: await editarSuscripcion(a, id, b) } }));
});
