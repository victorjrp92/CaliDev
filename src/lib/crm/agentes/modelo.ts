import { ErrorCrm } from "../actor";

/**
 * El modelo de lenguaje de los agentes del CRM: Gemini, la misma cuenta que ya
 * usa el ciclo de Instagram (GEMINI_API_KEY), así no hay otra clave que cuidar.
 * Siempre responde JSON; quien llama valida cada campo, el modelo no es fuente
 * de verdad de nada que se guarde sin revisar.
 *
 * Las pruebas cambian el modelo con `usarModelo` para no gastar ni depender de
 * la red; el modelo real se verifica en producción.
 */
const BASE = "https://generativelanguage.googleapis.com";
/** En orden: si uno está saturado o retirado (503/429/404), se prueba el siguiente. */
const MODELOS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash"];

export type Modelo = (prompt: string) => Promise<Record<string, unknown>>;

async function gemini(prompt: string): Promise<Record<string, unknown>> {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new ErrorCrm(503, "modelo_no_disponible", "Falta GEMINI_API_KEY: el agente no puede pensar sin modelo.");
  let ultimo = "";
  for (const modelo of MODELOS) {
    const r = await fetch(`${BASE}/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (r.status === 503 || r.status === 429 || r.status === 404) {
      ultimo = `${modelo}: HTTP ${r.status}`;
      await r.text();
      continue;
    }
    if (!r.ok) throw new ErrorCrm(502, "modelo_fallo", `Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const texto = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    try {
      const j = JSON.parse(texto);
      return j && typeof j === "object" && !Array.isArray(j) ? j : {};
    } catch {
      throw new ErrorCrm(502, "modelo_fallo", "El modelo no devolvió JSON.");
    }
  }
  throw new ErrorCrm(503, "modelo_no_disponible", `Gemini no disponible: ${ultimo}`);
}

let actual: Modelo = gemini;
export function usarModelo(fn: Modelo | null) {
  actual = fn ?? gemini;
}
export const preguntarModelo: Modelo = (prompt) => actual(prompt);

/** Lectores tolerantes: lo que no tenga la forma pedida se descarta, no se adivina. */
export const textoDe = (v: unknown, max = 2000): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
export const listaDe = (v: unknown, max = 10, largo = 300): string[] =>
  Array.isArray(v) ? v.map((x) => textoDe(x, largo)).filter((x): x is string => !!x).slice(0, max) : [];
