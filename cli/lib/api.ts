import { type Config, leerConfig } from "./config.ts";
import { ErrorCli, SALIDA } from "./errores.ts";

/**
 * Llamadas a `/api/crm/v1` con la clave como Bearer. Un error HTTP se vuelve
 * ErrorCli con el código de salida del spec: 400 es error de uso (el mensaje
 * nombra el campo), 403 sin permiso, y el resto 1. Un 202 no es error: lo
 * devuelve como `pendiente` para que el comando salga con 4.
 */
export type Respuesta<T> = { estado: number; cuerpo: T; pendiente: boolean };

type Opciones = {
  metodo?: "GET" | "POST" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  consulta?: Record<string, string | number | boolean | undefined | null>;
  idempotencia?: string;
  config?: Config;
};

type CuerpoError = { error?: { codigo?: string; mensaje?: string; campo?: string } };

export async function pedir<T = Record<string, unknown>>(ruta: string, o: Opciones = {}): Promise<Respuesta<T>> {
  const c = o.config ?? leerConfig();
  const url = new URL(`${c.url}/api/crm/v1${ruta}`);
  for (const [k, v] of Object.entries(o.consulta ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    url.searchParams.set(k, v === true ? "1" : String(v));
  }
  const cabeceras: Record<string, string> = { authorization: `Bearer ${c.clave}`, accept: "application/json" };
  if (o.cuerpo !== undefined) cabeceras["content-type"] = "application/json";
  if (o.idempotencia) cabeceras["idempotency-key"] = o.idempotencia;

  let r: Response;
  try {
    r = await fetch(url, {
      method: o.metodo ?? (o.cuerpo === undefined ? "GET" : "POST"),
      headers: cabeceras,
      body: o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo),
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    const causa = (e as Error & { cause?: Error }).cause?.message ?? (e as Error).message;
    throw new ErrorCli(SALIDA.otro, "sin_conexion", `No se pudo llegar a ${c.url}: ${causa}.`);
  }

  const texto = await r.text();
  let cuerpo: unknown = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    throw new ErrorCli(SALIDA.otro, "respuesta_invalida", `${c.url} respondió ${r.status} sin JSON. ¿La URL de calidev login es la correcta?`);
  }

  if (!r.ok) {
    const e = (cuerpo as CuerpoError)?.error ?? {};
    const mensaje = e.mensaje ?? `HTTP ${r.status}`;
    const codigo = e.codigo ?? `http_${r.status}`;
    if (r.status === 400) throw new ErrorCli(SALIDA.uso, codigo, mensaje, e.campo ?? null);
    if (r.status === 403) throw new ErrorCli(SALIDA.sinPermiso, codigo, mensaje, e.campo ?? null);
    if (r.status === 401) throw new ErrorCli(SALIDA.otro, codigo, mensaje.includes("calidev login") ? mensaje : `${mensaje} Corre calidev login con una clave vigente.`);
    throw new ErrorCli(SALIDA.otro, codigo, mensaje, e.campo ?? null);
  }
  return { estado: r.status, cuerpo: cuerpo as T, pendiente: r.status === 202 };
}
