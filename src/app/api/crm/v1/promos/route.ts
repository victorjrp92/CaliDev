import { crearPromo, listarPromos } from "@/lib/crm/catalogo";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  return ok({ promos: await listarPromos(a, { vigentes: consulta(request).si("vigentes") }) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "precio:fijar");
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { promo: await crearPromo(a, b) } }));
});
