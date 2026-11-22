import { ErrorCrm } from "@/lib/crm/actor";
import { listarAprobaciones, solicitar } from "@/lib/crm/aprobaciones";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, objeto, ok, texto, textoReq } from "@/lib/crm/http";

export const GET = api(async (request) => {
  await requerir(request, "aprobaciones:leer");
  const q = consulta(request);
  const estado = q.texto("estado") ?? "pendiente";
  return ok({ aprobaciones: await listarAprobaciones(estado === "todas" ? null : estado, q.entero("limite") ?? 100) });
});

/** Pedir una acción externa. Siempre 202: queda pendiente hasta que un humano decide. */
export const POST = api(async (request) => {
  const a = await requerir(request, "aprobaciones:solicitar");
  const b = await cuerpo(request);
  const payload = objeto(b, "payload");
  if (!payload) throw new ErrorCrm(400, "campo_requerido", "Falta payload (un objeto).", "payload");
  const ent = b.entidad_id;
  const s = {
    tipo: textoReq(b, "tipo", 40),
    payload,
    vistaPrevia: textoReq(b, "vista_previa", 20000),
    entidad: texto(b, "entidad", { max: 40 }),
    entidadId: typeof ent === "number" || typeof ent === "string" ? ent : null,
  };
  return idempotente(a, request, async () => {
    const ap = await solicitar(a, s);
    return { estado: 202, cuerpo: { aprobacion_id: ap.id, aprobacion: ap } };
  });
});
