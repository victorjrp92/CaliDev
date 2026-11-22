import { ErrorCrm } from "@/lib/crm/actor";
import { crearContratoCrm, listarContratos } from "@/lib/crm/contratos";
import { api, cuerpo, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, entero, ok, texto, textoReq } from "@/lib/crm/http";

export const GET = api(async (request) => {
  const a = await requerir(request, "contratos:leer");
  const q = consulta(request);
  return ok({
    contratos: await listarContratos(a, {
      estado: q.texto("estado"),
      oportunidadId: q.entero("oportunidad_id"),
      personaId: q.entero("persona_id"),
      limite: q.entero("limite") ?? 200,
    }),
  });
});

/** Con la plantilla de ServiNomic (`datos`) o con texto propio (`titulo`, `html`, `firmantes`). */
export const POST = api(async (request) => {
  const a = await requerir(request, "contratos:escribir");
  const b = await cuerpo(request);
  const plantilla = texto(b, "plantilla") ?? "servinomic";
  const enlaces = { oportunidadId: entero(b, "oportunidad_id"), personaId: entero(b, "persona_id"), empresaId: entero(b, "empresa_id") };
  let n: Parameters<typeof crearContratoCrm>[1];
  if (plantilla === "servinomic") {
    if (!b.datos || typeof b.datos !== "object") throw new ErrorCrm(400, "campo_requerido", "Falta datos (los de la plantilla; GET /api/crm/v1/contratos/borrador los arma desde la oportunidad).", "datos");
    n = { plantilla, datos: b.datos, ...enlaces };
  } else if (plantilla === "libre") {
    const firmantes = Array.isArray(b.firmantes) ? b.firmantes.map((f) => ({ rol: String((f as Record<string, unknown>)?.rol ?? ""), etiqueta: String((f as Record<string, unknown>)?.etiqueta ?? "") })) : [];
    n = { plantilla, titulo: textoReq(b, "titulo", 200), html: typeof b.html === "string" ? b.html : "", firmantes, ...enlaces };
  } else throw new ErrorCrm(400, "campo_invalido", "plantilla: servinomic o libre.", "plantilla");
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { contrato: await crearContratoCrm(a, n) } }));
});
