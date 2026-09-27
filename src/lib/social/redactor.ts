import { sumarConsumo } from "./db";
import { ESTILO_IA } from "./textos";

/** Respuestas con contexto usando DeepSeek (deepseek-chat, como en Witmi). */
const URL_DEEPSEEK = "https://api.deepseek.com/chat/completions";

export async function redactar(comentario: string, intencion: string, contextoPublicacion?: string | null) {
  const clave = process.env.DEEPSEEK_API_KEY;
  if (!clave) throw new Error("Falta DEEPSEEK_API_KEY");
  const r = await fetch(URL_DEEPSEEK, {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.9,
      max_tokens: 120,
      messages: [
        { role: "system", content: ESTILO_IA + (contextoPublicacion ? `\nContexto de la publicación: ${contextoPublicacion}` : "") },
        { role: "user", content: `Comentario: «${comentario}»\nObjetivo de la respuesta: ${intencion}` },
      ],
    }),
  });
  if (!r.ok) throw new Error(`DeepSeek HTTP ${r.status}`);
  await sumarConsumo("deepseek").catch(() => {});
  const texto: string = (await r.json()).choices[0].message.content.trim();
  // Límites de Meta: 300 caracteres. Dejamos margen.
  return texto.replace(/^["«»]+|["«»]+$/g, "").trim().slice(0, 290);
}
