import { conSesion } from "@/lib/crm/acceso";
import { api, cuerpo } from "@/lib/crm/guardia";
import { contrasena, textoReq } from "@/lib/crm/http";
import { aceptarInvitacion } from "@/lib/crm/usuarios";

/** La persona invitada elige su contraseña y queda dentro. El enlace sirve una sola vez. */
export const POST = api(async (request) => {
  const b = await cuerpo(request);
  const u = await aceptarInvitacion(textoReq(b, "token", 200), contrasena(b));
  return conSesion(u, { usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
});
