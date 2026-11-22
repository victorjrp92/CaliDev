import { ErrorCrm } from "@/lib/crm/actor";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { enlaceInvitacion, ok, textoReq } from "@/lib/crm/http";
import { crearUsuario, listarUsuarios } from "@/lib/crm/usuarios";

export const GET = api(async (request) => {
  await requerir(request, "usuarios:gestionar");
  return ok({ usuarios: await listarUsuarios() });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "usuarios:gestionar");
  const b = await cuerpo(request);
  const d = {
    nombre: textoReq(b, "nombre", 120),
    correo: textoReq(b, "correo", 160),
    tipo: textoReq(b, "tipo", 10),
    rol: textoReq(b, "rol", 20),
  };
  if (d.tipo !== "humano" && d.tipo !== "agente") throw new ErrorCrm(400, "campo_invalido", "tipo: humano o agente.", "tipo");
  const tipo = d.tipo;
  return idempotente(a, request, async () => {
    const { usuario, invitacion } = await crearUsuario(a, { ...d, tipo });
    return { estado: 201, cuerpo: { usuario, invitacion: invitacion ? enlaceInvitacion(request, invitacion) : null } };
  });
});
