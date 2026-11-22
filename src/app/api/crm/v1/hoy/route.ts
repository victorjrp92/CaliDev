import { after } from "next/server";
import { api, autenticar } from "@/lib/crm/guardia";
import { hoy } from "@/lib/crm/hoy";
import { consulta, ok } from "@/lib/crm/http";
import { sincronizarSiToca } from "@/lib/crm/sincronizar";

/** La pestaña Hoy. Cada bloque viene null si el actor no puede leerlo. */
export const GET = api(async (request) => {
  const a = await autenticar(request);
  // El backfill se mantiene al día sin bloquear la respuesta: como mucho una corrida cada 5 minutos.
  after(() => sincronizarSiToca(null, 300).catch((e) => console.error("[crm] backfill", e)));
  return ok(await hoy(a, { dia: consulta(request).texto("dia") }));
});
