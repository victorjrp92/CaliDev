import { enviarContrato } from "@/lib/crm/contratos";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { entero, idDe, texto } from "@/lib/crm/http";

/**
 * Manda (o reenvía) el enlace de firma por correo. Con `contrato:enviar` sale
 * ya (200); sin él queda en Aprobaciones con el correo exacto (202).
 */
export const POST = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "contratos:leer");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const o = { firmanteId: entero(b, "firmante_id"), correo: texto(b, "correo", { max: 200 }) };
  return idempotente(a, request, async () => {
    const r = await enviarContrato(a, id, o);
    return { estado: r.estado === "enviado" ? 200 : 202, cuerpo: r };
  });
});
