import { ErrorCrm } from "@/lib/crm/actor";
import { anularCobro, cobroPorId, registrarPago } from "@/lib/crm/cobros";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, ok, textoReq } from "@/lib/crm/http";

export const GET = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:leer");
  return ok({ cobro: await cobroPorId(a, idDe((await ctx.params).id)) });
});

/** `accion`: pagado (con metodo?, pagado_at?, tasa_eur?, tasa_usd?) o anulado (con motivo). */
export const PATCH = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const accion = textoReq(b, "accion", 20);
  if (accion !== "pagado" && accion !== "anulado") throw new ErrorCrm(400, "campo_invalido", "accion: pagado o anulado.", "accion");
  return idempotente(a, request, async () => ({
    estado: 200,
    cuerpo: {
      cobro: accion === "pagado"
        ? await registrarPago(a, id, { metodo: b.metodo, pagadoAt: b.pagado_at, tasaEur: b.tasa_eur, tasaUsd: b.tasa_usd })
        : await anularCobro(a, id, b.motivo),
    },
  }));
});
