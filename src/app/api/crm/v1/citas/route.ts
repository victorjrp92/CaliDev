import { citasEntre, citasSinHora, diaColombia, semanaColombia } from "@/lib/crm/agenda";
import { api, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

/** Citas de un día (?dia=AAAA-MM-DD, por defecto hoy en Colombia) o de la semana (?semana=1). */
export const GET = api(async (request) => {
  await requerir(request, "agenda:leer");
  const q = consulta(request);
  const rango = q.si("semana") ? semanaColombia() : diaColombia(q.texto("dia"));
  return ok({
    desde: rango.desde.toISOString(),
    hasta: rango.hasta.toISOString(),
    citas: await citasEntre(rango.desde, rango.hasta),
    sin_hora: await citasSinHora(50),
  });
});
