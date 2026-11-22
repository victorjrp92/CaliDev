import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, textoReq } from "@/lib/crm/http";
import { cerrarTarea, tomarTarea } from "@/lib/crm/tareas";

/** `accion`: tomar (me la asigno), hecha o cancelada. */
export const PATCH = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "tareas:escribir");
  const id = idDe((await ctx.params).id);
  const accion = textoReq(await cuerpo(request), "accion", 20);
  if (!["tomar", "hecha", "cancelada"].includes(accion)) throw new ErrorCrm(400, "campo_invalido", "accion: tomar, hecha o cancelada.", "accion");
  return idempotente(a, request, async () => ({
    estado: 200,
    cuerpo: { tarea: accion === "tomar" ? await tomarTarea(a, id) : await cerrarTarea(a, id, accion as "hecha" | "cancelada") },
  }));
});
