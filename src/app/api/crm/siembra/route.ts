import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ErrorCrm } from "@/lib/crm/actor";
import { hashSecreto } from "@/lib/crm/claves";
import { api, cuerpo } from "@/lib/crm/guardia";
import { textoReq } from "@/lib/crm/http";
import { algunHumanoEntro, sembrarHumanos } from "@/lib/crm/sembrar";

/**
 * TEMPORAL (entrega 1a). Siembra a Victor y Karen desde el servidor, porque
 * Vercel no deja leer SUPABASE_DB_URL desde fuera. Se retira en el deploy de
 * la 1b junto con la variable CRM_SIEMBRA_TOKEN.
 *
 * Está apagada (404) si falta CRM_SIEMBRA_TOKEN o si algún humano ya entró con
 * contraseña: en cuanto Victor entra, deja de existir sin otro deploy.
 * Va fuera de /api/crm/v1 a propósito: no es parte del contrato de la API.
 */
const noExiste = () => new ErrorCrm(404, "no_existe", "No existe.");

function tokenCorrecto(request: Request, esperado: string): boolean {
  const m = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "");
  if (!m) return false;
  // Se comparan los hashes: mismo largo siempre, sin filtrar el largo del token.
  return timingSafeEqual(Buffer.from(hashSecreto(m[1]), "hex"), Buffer.from(hashSecreto(esperado), "hex"));
}

export const POST = api(async (request) => {
  const esperado = process.env.CRM_SIEMBRA_TOKEN;
  if (!esperado || esperado.length < 32) throw noExiste();
  if (!tokenCorrecto(request, esperado)) throw noExiste();
  if (await algunHumanoEntro()) throw noExiste();
  const b = await cuerpo(request);
  const resultado = await sembrarHumanos(
    { victor: textoReq(b, "victor", 160), karen: textoReq(b, "karen", 160) },
    new URL(request.url).origin,
  );
  return NextResponse.json({ resultado }, { headers: { "cache-control": "no-store" } });
});
