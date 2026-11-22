import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok, texto, textoReq } from "@/lib/crm/http";
import { agregarNota, notasDe } from "@/lib/crm/notas";

export const GET = api(async (request) => {
  await requerir(request, "notas:leer");
  const q = consulta(request);
  const entidad = q.texto("entidad");
  const id = q.texto("id");
  if (!entidad || !id) throw new ErrorCrm(400, "campo_requerido", "Pasa ?entidad=persona&id=7.", entidad ? "id" : "entidad");
  return ok({ notas: await notasDe(entidad, id) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "notas:escribir");
  const b = await cuerpo(request);
  const ent = b.entidad_id;
  if (typeof ent !== "number" && typeof ent !== "string") throw new ErrorCrm(400, "campo_requerido", "Falta entidad_id.", "entidad_id");
  const d = { entidad: textoReq(b, "entidad", 40), entidadId: ent, tipo: texto(b, "tipo") ?? undefined, cuerpo: textoReq(b, "cuerpo") };
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { nota: await agregarNota(a, d) } }));
});
