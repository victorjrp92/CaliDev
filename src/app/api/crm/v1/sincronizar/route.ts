import { api, requerir } from "@/lib/crm/guardia";
import { ok } from "@/lib/crm/http";
import { sincronizarSiToca } from "@/lib/crm/sincronizar";

/** Fuerza la sincronización ahora (intervalo 0). Idempotente: correrla dos veces no duplica. */
export const POST = api(async (request) => {
  const a = await requerir(request, "sistema:sincronizar");
  return ok({ resumen: await sincronizarSiToca(a, 0) });
});
