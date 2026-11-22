import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, ok, texto, textoReq } from "@/lib/crm/http";
import { buscarPersonas, crearPersona, type DatosPersona } from "@/lib/crm/personas";

export const GET = api(async (request) => {
  await requerir(request, "contactos:leer");
  const q = consulta(request);
  return ok({ personas: await buscarPersonas(q.texto("q"), q.entero("limite") ?? 50) });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "contactos:escribir");
  const b = await cuerpo(request);
  const d: DatosPersona = { nombre: textoReq(b, "nombre", 160) };
  for (const k of ["correo", "whatsapp", "igsid", "usuario_ig", "origen", "notas", "empresa"] as const) {
    const v = texto(b, k, { max: k === "notas" ? 5000 : 200 });
    if (v !== undefined) d[k] = v;
  }
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { persona: await crearPersona(a, d) } }));
});
