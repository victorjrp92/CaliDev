import { api, cuerpo, idempotente, puede, requerir } from "@/lib/crm/guardia";
import { entero, listaTexto, ok, textoReq } from "@/lib/crm/http";
import { crearClaveDe, listarClaves } from "@/lib/crm/usuarios";

/** Con claves:gestionar se ven y crean las de todos (agentes incluidos); si no, solo las propias. */
export const GET = api(async (request) => {
  const a = await requerir(request, "claves:propias");
  return ok({ claves: await listarClaves(puede(a, "claves:gestionar") ? undefined : a.usuario.id) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "claves:propias");
  const b = await cuerpo(request);
  const d = {
    usuarioId: entero(b, "usuario_id") ?? a.usuario.id,
    nombre: textoReq(b, "nombre", 80),
    alcances: listaTexto(b, "alcances") ?? [],
    diasVigencia: entero(b, "dias_vigencia"),
  };
  return idempotente(a, request, async () => {
    const { clave, registro } = await crearClaveDe(a, d, puede(a, "claves:gestionar"));
    return { estado: 201, cuerpo: { clave, registro, aviso: "Guárdala ahora: no se vuelve a mostrar." } };
  });
});
