import { resumirLlamada } from "@/lib/crm/agentes/resumen";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { entero, textoReq } from "@/lib/crm/http";

export const maxDuration = 60;

/** Notas crudas de una llamada → nota resumen_llamada + propuesta de etapa que espera en Aprobaciones. */
export const POST = api(async (request) => {
  const a = await requerir(request, "notas:escribir");
  const b = await cuerpo(request);
  const d = { oportunidadId: entero(b, "oportunidad_id"), citaId: entero(b, "cita_id"), notas: textoReq(b, "notas", 12_000) };
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: await resumirLlamada(a, d) }));
});
