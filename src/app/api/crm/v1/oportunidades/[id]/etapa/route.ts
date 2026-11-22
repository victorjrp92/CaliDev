import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, texto, textoReq } from "@/lib/crm/http";
import { moverEtapa } from "@/lib/crm/oportunidades";

/** Mover de etapa. Ganar exige además `oportunidad:ganar` (los agentes nunca lo tienen). */
export const POST = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "ventas:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const m = {
    a: textoReq(b, "a", 40),
    proximoPaso: texto(b, "proximo_paso", { max: 300 }),
    proximoPasoAt: texto(b, "proximo_paso_at"),
    motivoPerdida: texto(b, "motivo_perdida", { max: 500 }),
  };
  return idempotente(a, request, async () => ({ estado: 200, cuerpo: { oportunidad: await moverEtapa(a, id, m) } }));
});
