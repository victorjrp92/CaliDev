import { sumarConsumo } from "./db";
import { preguntasComentario, PREGUNTAS_DM } from "./preguntas";
import type { RamaDm, TipoComentario } from "./tipos";

/**
 * Clasificación con Jev (TypeSafe): probabilidad calibrada, por eso hay un
 * umbral y lo dudoso va a Victor en vez de adivinarse.
 */
const URL_JEV = "https://api.typesafe.ai/v1/systemone";

async function preguntar(estado: string, preguntas: unknown) {
  const clave = process.env.TYPESAFE_API_KEY;
  if (!clave) throw new Error("Falta TYPESAFE_API_KEY");
  let espera = 500;
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(URL_JEV, {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: estado, model: "jev-latest", questions: preguntas }),
      signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) {
      await sumarConsumo("jev").catch(() => {});
      return (await r.json()).answers;
    }
    if (![429, 500, 502, 503, 504].includes(r.status)) {
      throw new Error(`Jev HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    }
    await new Promise((ok) => setTimeout(ok, espera));
    espera *= 2;
  }
  throw new Error("Jev no respondió tras 4 intentos");
}

export async function clasificarComentario(texto: string, contexto: string | null) {
  const a = (await preguntar(`Comentario de Instagram: ${texto}`, preguntasComentario(contexto))).tipo;
  return { tipo: a.choice as TipoComentario, confianza: a.confidence as number };
}

export async function clasificarDm(texto: string) {
  const a = (await preguntar(`Mensaje directo de Instagram: ${texto}`, PREGUNTAS_DM)).rama;
  return { rama: a.choice as RamaDm, confianza: a.confidence as number };
}
