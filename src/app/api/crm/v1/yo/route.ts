import { api, autenticar, puede } from "@/lib/crm/guardia";
import { ok } from "@/lib/crm/http";
import { PERMISOS } from "@/lib/crm/permisos";

/** Quién soy y qué puedo: el CLI lo usa tras `calidev login` para confirmar la clave. */
export const GET = api(async (request) => {
  const a = await autenticar(request);
  return ok({
    usuario: a.usuario,
    origen: a.origen,
    clave_id: a.claveId,
    alcances: a.alcances,
    permisos: PERMISOS.filter((p) => puede(a, p)),
  });
});
