import { conSesion, entrarConLimite, sinSesion } from "@/lib/crm/acceso";
import { api, cuerpo } from "@/lib/crm/guardia";
import { contrasena, textoReq } from "@/lib/crm/http";

/** Entrar: correo y contraseña → cookie `crm_sesion`. */
export const POST = api(async (request) => {
  const b = await cuerpo(request);
  const u = await entrarConLimite(textoReq(b, "correo", 160), contrasena(b));
  return conSesion(u, { usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
});

/** Salir: borra la cookie de este navegador. Para cerrar todas, Agentes → Equipo → Cerrar sesiones. */
export const DELETE = api(async () => sinSesion());
