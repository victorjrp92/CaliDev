import { api, cuerpo, exigir, idempotente, requerir } from "@/lib/crm/guardia";
import { consulta, entero, ok, texto, textoReq } from "@/lib/crm/http";
import { crearOportunidad, listarOportunidades } from "@/lib/crm/oportunidades";

export const GET = api(async (request) => {
  await requerir(request, "ventas:leer");
  const q = consulta(request);
  return ok({
    oportunidades: await listarOportunidades({
      etapa: q.texto("etapa"),
      abiertas: q.si("abiertas"),
      personaId: q.entero("persona_id"),
      vencenAntes: q.si("vencidas") ? new Date().toISOString() : null,
      limite: q.entero("limite") ?? 200,
    }),
  });
});

export const POST = api(async (request) => {
  const a = await requerir(request, "ventas:escribir");
  const b = await cuerpo(request);
  // El precio lo pone un humano: los agentes preparan la oportunidad, no la cotizan.
  if (b.valor_arranque != null || b.valor_mensual != null) exigir(a, "precio:fijar");
  const d = {
    titulo: textoReq(b, "titulo", 200),
    personaId: entero(b, "persona_id"),
    empresaId: entero(b, "empresa_id"),
    etapa: texto(b, "etapa") ?? undefined,
    proximoPaso: texto(b, "proximo_paso", { max: 300 }),
    proximoPasoAt: texto(b, "proximo_paso_at"),
    valorArranque: b.valor_arranque,
    valorMensual: b.valor_mensual,
    moneda: texto(b, "moneda") ?? undefined,
    responsableId: entero(b, "responsable_id"),
    origen: texto(b, "origen", { max: 60 }),
    motivoPerdida: texto(b, "motivo_perdida", { max: 500 }),
  };
  return idempotente(a, request, async () => ({ estado: 201, cuerpo: { oportunidad: await crearOportunidad(a, d) } }));
});
