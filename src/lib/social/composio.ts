import { sumarConsumo } from "./db";

/**
 * Cliente de Composio por MCP sobre HTTP (probado el 27 sep 2026 desde el
 * agente local). Usa la clave "consumer" de Victor: la misma cuenta y la misma
 * conexión de Instagram (@calidevdev) que usa Claude Code.
 *
 * Dos formas de llamar:
 * - herramienta(slug, args): una herramienta de Composio.
 * - proxy(método, url, body, query): llamada cruda a la API de Instagram con la
 *   conexión de Composio, vía el sandbox. Hace falta para botones, tarjetas y
 *   la respuesta privada, que Composio no expone como herramienta.
 */
const URL_MCP = "https://connect.composio.dev/mcp";

let sesion: string | null = null;
let siguienteId = 1;

function clave() {
  const k = process.env.COMPOSIO_CONSUMER_KEY;
  if (!k) throw new Error("Falta COMPOSIO_CONSUMER_KEY");
  return k;
}

async function post(cuerpo: unknown, sid: string | null) {
  const cabeceras: Record<string, string> = {
    "x-consumer-api-key": clave(),
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sid) cabeceras["mcp-session-id"] = sid;
  // Tope por llamada: en Vercel una llamada colgada quemaría la ejecución entera.
  const r = await fetch(URL_MCP, {
    method: "POST", headers: cabeceras, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(25_000),
  });
  return r;
}

async function abrir() {
  const r = await post(
    {
      jsonrpc: "2.0", id: 0, method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "calidev-social", version: "1" } },
    },
    null,
  );
  if (!r.ok) throw new Error(`Composio initialize HTTP ${r.status}`);
  sesion = r.headers.get("mcp-session-id");
  await r.text();
  await (await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sesion)).text();
}

/** La respuesta llega como SSE: el mensaje útil es la última línea `data:`. */
function leerSse(texto: string) {
  const datos = texto.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
  return JSON.parse(datos.length ? datos[datos.length - 1] : texto);
}

async function llamar(nombre: string, argumentos: unknown) {
  if (!sesion) await abrir();
  const cuerpo = { jsonrpc: "2.0", id: siguienteId++, method: "tools/call", params: { name: nombre, arguments: argumentos } };
  let r = await post(cuerpo, sesion);
  if (r.status === 400 || r.status === 404) {
    await r.text();
    await abrir(); // sesión caducada: reabrir una vez
    r = await post(cuerpo, sesion);
  }
  if (!r.ok) throw new Error(`Composio ${nombre} HTTP ${r.status}`);
  const msg = leerSse(await r.text());
  if (msg.error) throw new Error(`Composio ${nombre}: ${JSON.stringify(msg.error).slice(0, 300)}`);
  await sumarConsumo("composio").catch(() => {});
  return JSON.parse(msg.result.content[0].text);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function herramienta(slug: string, argumentos: Record<string, unknown>): Promise<any> {
  const r = await llamar("COMPOSIO_MULTI_EXECUTE_TOOL", {
    tools: [{ tool_slug: slug, arguments: argumentos }],
    sync_response_to_workbench: false,
  });
  const res = r.data.results[0];
  if (!res?.response?.successful) throw new Error(`${slug}: ${JSON.stringify(res).slice(0, 400)}`);
  return res.response.data;
}

export async function proxy(
  metodo: "GET" | "POST",
  url: string,
  body?: unknown,
  query?: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // El sandbox es Python: el cuerpo viaja como JSON y se decodifica allí, así
  // ningún texto del usuario se interpreta como código.
  const codigo =
    "import json\n" +
    `r = proxy_execute(method=${JSON.stringify(metodo)}, endpoint=${JSON.stringify(url)}, toolkit='instagram',` +
    ` body=json.loads(${JSON.stringify(JSON.stringify(body ?? null))}),` +
    ` query_params=json.loads(${JSON.stringify(JSON.stringify(query ?? null))}))\n` +
    "print('@@' + json.dumps(r[0]) + '@@' + json.dumps(r[1]))\n";
  const r = await llamar("COMPOSIO_REMOTE_WORKBENCH", { code_to_execute: codigo });
  const salida: string = r.data?.stdout ?? "";
  const partes = salida.split("@@");
  if (partes.length < 3) throw new Error(`proxy sin salida: ${JSON.stringify(r).slice(0, 300)}`);
  const [, datosTxt, errorTxt] = partes.slice(-3);
  const datos = JSON.parse(datosTxt);
  const error = errorTxt.trim();
  if ((error && error !== '""') || (datos && typeof datos === "object" && "error" in datos) || datos?.data?.error) {
    throw new Error(`proxy ${url}: ${error} ${JSON.stringify(datos).slice(0, 300)}`);
  }
  return datos;
}
