import { ENDPOINTS } from "@/lib/crm/endpoints";
import { api, autenticar } from "@/lib/crm/guardia";
import { ok } from "@/lib/crm/http";

/** La lista de endpoints (spec §7): lo que imprime `calidev api`. */
export const GET = api(async (request) => {
  await autenticar(request);
  return ok({ version: "v1", endpoints: ENDPOINTS });
});
