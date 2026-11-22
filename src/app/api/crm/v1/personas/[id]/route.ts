import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, idempotente, puede, requerir } from "@/lib/crm/guardia";
import { idDe, ok, texto } from "@/lib/crm/http";
import { notasDe } from "@/lib/crm/notas";
import { listarOportunidades } from "@/lib/crm/oportunidades";
import { type DatosPersona, editarPersona, lineaDeTiempo, personaPorId } from "@/lib/crm/personas";

type P = { id: string };

/** La ficha: datos, línea de tiempo y, si se pueden leer, oportunidades y notas. */
export const GET = api<P>(async (request, ctx) => {
  const a = await requerir(request, "contactos:leer");
  const id = idDe((await ctx.params).id);
  const persona = await personaPorId(id);
  if (!persona) throw new ErrorCrm(404, "no_existe", `No hay persona ${id}.`);
  return ok({
    persona,
    linea_de_tiempo: await lineaDeTiempo(id),
    oportunidades: puede(a, "ventas:leer") ? await listarOportunidades({ personaId: id }) : null,
    notas: puede(a, "notas:leer") ? await notasDe("persona", id) : null,
  });
});

export const PATCH = api<P>(async (request, ctx) => {
  const a = await requerir(request, "contactos:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const d: DatosPersona = {};
  for (const k of ["nombre", "correo", "whatsapp", "igsid", "usuario_ig", "origen", "notas", "empresa"] as const) {
    const v = texto(b, k, { max: k === "notas" ? 5000 : 200 });
    if (v !== undefined) (d as Record<string, string | null>)[k] = v;
  }
  return idempotente(a, request, async () => ({ estado: 200, cuerpo: { persona: await editarPersona(a, id, d) } }));
});
