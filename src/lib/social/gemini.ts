import { sumarConsumo } from "./db";
import type { Escena, Punto } from "./caidas";

/**
 * Análisis de video con Gemini (puede "ver" el video completo). Dos usos:
 * - analizarVideo: transcripción con tiempos, escenas y evaluación del gancho
 *   con los ejes de la rúbrica de la skill video-viral.
 * - leerCurva: lee la captura de la gráfica de retención de la app de
 *   Instagram, que la API no entrega.
 * Nunca se inventa una curva: si no hay captura, no hay curva.
 */
const BASE = "https://generativelanguage.googleapis.com";
/** En orden: si uno está saturado (503/429), se prueba el siguiente. */
const MODELOS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"];

function clave() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("Falta GEMINI_API_KEY");
  return k;
}

async function subir(bytes: ArrayBuffer, mime: string): Promise<{ uri: string; name: string }> {
  const inicio = await fetch(`${BASE}/upload/v1beta/files?key=${clave()}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mime,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "reel" } }),
    signal: AbortSignal.timeout(20_000),
  });
  const url = inicio.headers.get("x-goog-upload-url");
  if (!url) throw new Error(`Gemini no dio URL de subida (HTTP ${inicio.status})`);
  const fin = await fetch(url, {
    method: "POST",
    headers: { "X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0" },
    body: bytes,
    signal: AbortSignal.timeout(40_000),
  });
  const { file } = await fin.json();
  // El video queda PROCESSING unos segundos antes de poder usarse.
  for (let i = 0; i < 20 && file.state !== "ACTIVE"; i++) {
    await new Promise((ok) => setTimeout(ok, 1500));
    const r = await fetch(`${BASE}/v1beta/${file.name}?key=${clave()}`, { signal: AbortSignal.timeout(10_000) });
    Object.assign(file, await r.json());
    if (file.state === "FAILED") throw new Error("Gemini no pudo procesar el video");
  }
  if (file.state !== "ACTIVE") throw new Error("El video tardó demasiado en procesarse");
  return { uri: file.uri, name: file.name };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generar(partes: any[]): Promise<any> {
  let ultimo = "";
  for (const modelo of MODELOS) {
    const r = await fetch(`${BASE}/v1beta/models/${modelo}:generateContent?key=${clave()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: partes }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (r.status === 503 || r.status === 429) {
      ultimo = `${modelo} saturado (HTTP ${r.status})`;
      await r.text();
      continue;
    }
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await sumarConsumo("gemini").catch(() => {});
    const texto = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(texto);
  }
  throw new Error(`Gemini no disponible: ${ultimo}`);
}

const PROMPT_VIDEO = `Analiza este reel de Instagram de Calidev (empresa que ordena y digitaliza pymes en Latinoamérica).
Devuelve SOLO este JSON (español):
{
 "duracion_s": number,
 "transcripcion": [{"t0": seg, "t1": seg, "texto": "lo que se dice"}],
 "escenas": [{"t0": seg, "t1": seg, "visual": "qué se ve", "dicho": "qué se dice", "texto_pantalla": "texto en pantalla o ''"}],
 "gancho": {
   "retencion": {"tiempo_al_contexto": 0-20, "brecha_curiosidad": 0-20, "rostro_primer_segundo": 0-15,
                 "formato_reconocible": 0-15, "especificidad": 0-10, "anclaje_visual": 0-10, "credencial": 0-5, "total": 0-100},
   "moneda_social": {"demostrable": 0-30, "test_una_frase": 0-25, "identidad": 0-25, "sin_exageracion": 0-20, "total": 0-100},
   "aciertos": ["frases cortas"], "fallos": ["frases cortas, con el segundo exacto si aplica"],
   "texto_pantalla_desde_s": number | null
 },
 "recomendacion": "una frase accionable para el próximo video"
}
Criterios: tiempo_al_contexto = en qué segundo se entiende de qué va (≤1,5 s = 20). brecha_curiosidad = deja una pregunta que el cuerpo responde.
rostro_primer_segundo = cara mirando a cámara en el primer segundo. formato_reconocible = se entiende en 1 s.
Moneda social: si alguien lo comparte, ¿queda bien? Penaliza exageración y promesas que el video no cumple.
Sé estricto y concreto. No inventes lo que no está en el video.`;

export interface AnalisisVideo {
  duracion_s: number;
  transcripcion: { t0: number; t1: number; texto: string }[];
  escenas: (Escena & { texto_pantalla?: string })[];
  gancho: {
    retencion: Record<string, number>; moneda_social: Record<string, number>;
    aciertos: string[]; fallos: string[]; texto_pantalla_desde_s: number | null;
  };
  recomendacion: string;
}

export async function analizarVideo(urlVideo: string): Promise<AnalisisVideo> {
  const r = await fetch(urlVideo, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`No se pudo descargar el video (HTTP ${r.status})`);
  const bytes = await r.arrayBuffer();
  if (bytes.byteLength > 45 * 1024 * 1024) throw new Error("Video muy largo para analizar aquí (más de 45 MB)");
  const f = await subir(bytes, r.headers.get("content-type") ?? "video/mp4");
  return generar([{ file_data: { mime_type: "video/mp4", file_uri: f.uri } }, { text: PROMPT_VIDEO }]);
}

export async function leerCurva(imagen: ArrayBuffer, mime: string, duracion: number | null): Promise<Punto[]> {
  const b64 = Buffer.from(imagen).toString("base64");
  const d = await generar([
    { inline_data: { mime_type: mime, data: b64 } },
    {
      text: `Es la gráfica de retención de un reel en la app de Instagram (eje X: tiempo; eje Y: % de espectadores que siguen).
${duracion ? `El video dura ${duracion} s.` : ""}
Lee la curva y devuelve SOLO: {"puntos": [{"s": segundo, "pct": porcentaje}]} con un punto por segundo si se puede, mínimo 10 puntos.
Si la imagen no es una gráfica de retención, devuelve {"puntos": []}.`,
    },
  ]);
  const puntos = (d.puntos ?? []) as Punto[];
  return puntos.filter((p) => Number.isFinite(p.s) && Number.isFinite(p.pct) && p.pct >= 0 && p.pct <= 100);
}
