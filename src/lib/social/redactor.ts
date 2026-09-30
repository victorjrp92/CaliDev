import { sumarConsumo } from "./db";
import { ESTILO_IA } from "./textos";

/**
 * Respuestas con contexto usando Gemini.
 *
 * Antes lo hacía DeepSeek, que procesa en China: la SIC no reconoce a China
 * como país con nivel adecuado de protección y quien comenta en Instagram no
 * autorizó esa transferencia. Google procesa en EE. UU., que sí está en la
 * lista de la Circular Externa 005 de 2017.
 */
const BASE = "https://generativelanguage.googleapis.com";
/**
 * En orden: si uno está saturado (503/429) o Google lo retiró (404), se prueba
 * el siguiente. Google retira modelos para cuentas nuevas sin aviso
 * (2.5-flash dio 404 el 2026-09-30), por eso el 404 tampoco es fatal.
 *
 * Flash-lite y no flash: para dos frases basta, y medido el 2026-09-30 contestó
 * en ~2,5 s mientras los flash grandes estaban saturados (503) o tardaban
 * 12-14 s. DeepSeek tardaba ~2 s; el ciclo de comentarios no aguanta más.
 */
const MODELOS = ["gemini-3.1-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash-lite"];

export async function redactar(comentario: string, intencion: string, contextoPublicacion?: string | null) {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new Error("Falta GEMINI_API_KEY");
  const cuerpo = JSON.stringify({
    systemInstruction: {
      parts: [{ text: ESTILO_IA + (contextoPublicacion ? `\nContexto de la publicación: ${contextoPublicacion}` : "") }],
    },
    contents: [{ role: "user", parts: [{ text: `Comentario: «${comentario}»\nObjetivo de la respuesta: ${intencion}` }] }],
    // Tope holgado a propósito: si el modelo piensa, gasta tokens antes de
    // escribir y con un tope corto devuelve la respuesta vacía. El largo lo
    // controlan las reglas de ESTILO_IA y el recorte de abajo.
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: "minimal" } },
  });

  let ultimo = "";
  for (const modelo of MODELOS) {
    const r = await fetch(`${BASE}/v1beta/models/${modelo}:generateContent?key=${clave}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: cuerpo,
    });
    if (r.status === 503 || r.status === 429 || r.status === 404) {
      ultimo = `${modelo} no disponible (HTTP ${r.status})`;
      await r.text();
      continue;
    }
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await sumarConsumo("gemini_redactor").catch(() => {});
    const partes: { text?: string; thought?: boolean }[] = (await r.json()).candidates?.[0]?.content?.parts ?? [];
    const texto = partes.filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
    if (!texto) throw new Error(`Gemini devolvió una respuesta vacía (${modelo})`);
    // Límites de Meta: 300 caracteres. Dejamos margen.
    return texto.replace(/^["«»]+|["«»]+$/g, "").trim().slice(0, 290);
  }
  throw new Error(`Gemini no disponible: ${ultimo}`);
}
