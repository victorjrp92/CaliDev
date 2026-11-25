import type { Actor } from "@/lib/crm/actor";
import { listarSuscripciones } from "@/lib/crm/suscripciones";

/** Las empresas que tienen alguna suscripción, por nombre: las que se pueden elegir al cobrar o imputar un gasto. */
export async function empresasDeSuscripciones(a: Actor): Promise<{ id: number; nombre: string }[]> {
  const mapa = new Map<number, string>();
  for (const s of await listarSuscripciones(a, { estado: "todas" })) mapa.set(s.empresa_id, s.empresa);
  return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
}
