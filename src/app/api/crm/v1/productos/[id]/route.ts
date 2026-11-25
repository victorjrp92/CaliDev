import { editarProducto, productoPorId } from "@/lib/crm/catalogo";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { idDe, ok } from "@/lib/crm/http";

/** Producto con el historial completo de precios. */
export const GET = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:leer");
  return ok({ producto: await productoPorId(a, idDe((await ctx.params).id)) });
});

export const PATCH = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "finanzas:escribir");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({ estado: 200, cuerpo: { producto: await editarProducto(a, id, { nombre: b.nombre, descripcion: b.descripcion, activo: b.activo }) } }));
});
