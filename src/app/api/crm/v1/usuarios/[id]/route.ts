import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, requerir } from "@/lib/crm/guardia";
import { booleano, enlaceInvitacion, idDe, ok } from "@/lib/crm/http";
import { cambiarActivo, cerrarSesiones, reinvitar } from "@/lib/crm/usuarios";

/** Activar/desactivar, reinvitar (devuelve el enlace nuevo) o cerrar todas sus sesiones. */
export const PATCH = api<{ id: string }>(async (request, ctx) => {
  const a = await requerir(request, "usuarios:gestionar");
  const id = idDe((await ctx.params).id);
  const b = await cuerpo(request);
  const activo = booleano(b, "activo");
  const otraVez = booleano(b, "reinvitar");
  const cerrar = booleano(b, "cerrar_sesiones");
  if (activo === undefined && !otraVez && !cerrar) throw new ErrorCrm(400, "sin_cambios", "Pasa activo, reinvitar o cerrar_sesiones.");
  if (activo !== undefined) await cambiarActivo(a, id, activo);
  if (cerrar) await cerrarSesiones(a, id);
  const invitacion = otraVez ? enlaceInvitacion(request, await reinvitar(a, id)) : null;
  return ok({ ok: true, invitacion });
});
