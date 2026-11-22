import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Actor } from "./actor";
import { actorPorCookie, puede } from "./guardia";
import type { Permiso } from "./permisos";
import { COOKIE_SESION } from "./sesion";

/**
 * Las páginas /crm/** se protegen en el servidor (spec §6): sin sesión, a
 * /crm/entrar. Las páginas leen con las mismas funciones que la API; las
 * escrituras van siempre por la API.
 */
export async function actorDePagina(): Promise<Actor> {
  const actor = await actorPorCookie((await cookies()).get(COOKIE_SESION)?.value);
  if (!actor) redirect("/crm/entrar");
  return actor;
}

/** Para una sección que pide un permiso que el rol no da: se dice, no se esconde en un 404. */
export const tiene = (a: Actor, p: Permiso) => puede(a, p);
