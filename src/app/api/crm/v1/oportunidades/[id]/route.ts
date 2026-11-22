import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, exigir, idempotente, puede, requerir } from "@/lib/crm/guardia";
import { entero, idDe, ok, texto } from "@/lib/crm/http";
import { notasDe } from "@/lib/crm/notas";
import { type CambiosOportunidad, editarOportunidad, fijarProximoPaso, historialDe, oportunidadPorId } from "@/lib/crm/oportunidades";

type P = { id: string };

export const GET = api<P>(async (request, ctx) => {
  const a = await requerir(request, "ventas:leer");
  const id = idDe((await ctx.params).id);
  const oportunidad = await oportunidadPorId(id);
  if (!oportunidad) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${id}.`);
  return ok({
    oportunidad,
    historial: await historialDe(id),
    notas: puede(a, "notas:leer") ? await notasDe("oportunidad", id) : null,
  });
});

/** Editar datos y/o fijar el próximo paso. El paso y su fecha van juntos. */
export const PATCH = api<P>(async (request, ctx) => {
  const a = await requerir(request, "ventas:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const c: CambiosOportunidad = {};
  const t = texto(b, "titulo", { max: 200 });
  if (t !== undefined && t !== null) c.titulo = t;
  if ("valor_arranque" in b || "valor_mensual" in b) exigir(a, "precio:fijar");
  if ("valor_arranque" in b) c.valorArranque = b.valor_arranque;
  if ("valor_mensual" in b) c.valorMensual = b.valor_mensual;
  const m = texto(b, "moneda");
  if (m) c.moneda = m;
  for (const [k, campo] of [["responsable_id", "responsableId"], ["persona_id", "personaId"], ["empresa_id", "empresaId"]] as const) {
    const v = entero(b, k);
    if (v !== undefined) c[campo] = v;
  }
  const paso = texto(b, "proximo_paso", { max: 300 });
  const fecha = texto(b, "proximo_paso_at");
  if ((paso === undefined) !== (fecha === undefined)) {
    throw new ErrorCrm(400, "campo_requerido", "proximo_paso y proximo_paso_at van juntos.", paso === undefined ? "proximo_paso" : "proximo_paso_at");
  }
  if (!Object.keys(c).length && paso === undefined) throw new ErrorCrm(400, "sin_cambios", "No hay nada que cambiar en el cuerpo.");

  return idempotente(a, request, async () => {
    let o = Object.keys(c).length ? await editarOportunidad(a, id, c) : null;
    if (paso !== undefined) o = await fijarProximoPaso(a, id, paso ?? "", fecha ?? "");
    return { estado: 200, cuerpo: { oportunidad: o } };
  });
});
