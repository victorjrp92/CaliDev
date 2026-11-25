import { crearProducto, listarProductos } from "@/lib/crm/catalogo";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok } from "@/lib/crm/http";

/** Catálogo con sus precios vigentes (?todos=1 incluye los inactivos). */
export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  return ok({ productos: await listarProductos(a, { todos: consulta(request).si("todos") }) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "finanzas:escribir");
  const b = await cuerpo(request);
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { producto: await crearProducto(a, { nombre: b.nombre, descripcion: b.descripcion }) } }));
});
