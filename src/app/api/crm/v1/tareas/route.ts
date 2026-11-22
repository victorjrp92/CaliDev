import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, entero, ok, texto, textoReq } from "@/lib/crm/http";
import { crearTarea, listarTareas } from "@/lib/crm/tareas";

export const GET = api(async (request) => {
  const a = await requerir(request, "tareas:leer");
  const q = consulta(request);
  return ok({
    tareas: await listarTareas({
      asignadaA: q.si("mia") ? a.usuario.id : q.entero("asignada_a"),
      area: q.texto("area"),
      estado: q.texto("estado") ?? "abierta",
      limite: q.entero("limite") ?? 200,
    }),
  });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "tareas:escribir");
  const b = await cuerpo(request);
  const ent = b.entidad_id;
  const d = {
    titulo: textoReq(b, "titulo", 300),
    area: texto(b, "area") ?? undefined,
    entidad: texto(b, "entidad", { max: 40 }),
    entidadId: typeof ent === "number" || typeof ent === "string" ? ent : null,
    asignadaA: entero(b, "asignada_a"),
    venceAt: texto(b, "vence_at"),
  };
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { tarea: await crearTarea(a, d) } }));
});
