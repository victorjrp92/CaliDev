import { ErrorCrm } from "@/lib/crm/actor";
import { decidir } from "@/lib/crm/aprobaciones";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, objeto, texto, textoReq } from "@/lib/crm/http";

/** Aprobar (con el payload editado, si se corrigió el texto) o rechazar con motivo. Solo humanos. */
export const POST = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "aprobaciones:decidir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const decision = textoReq(b, "decision", 10);
  if (decision !== "aprobar" && decision !== "rechazar") throw new ErrorCrm(400, "campo_invalido", "decision: aprobar o rechazar.", "decision");
  const d = { decision, motivo: texto(b, "motivo", { max: 2000 }), payload: objeto(b, "payload") } as const;
  return idempotente(a, request, async () => ({ estado: 200, cuerpo: { aprobacion: await decidir(a, id, d) } }));
});
