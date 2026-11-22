/**
 * La UI habla con el CRM por la misma API que el CLI (spec §1.1): nada de
 * server actions con lógica propia. Esto es lo único que sabe hacer el
 * navegador: llamar y convertir el error de la API en un mensaje legible.
 */
export type ErrorApi = { codigo: string; mensaje: string; campo?: string };

export class FalloApi extends Error {
  constructor(public estado: number, public error: ErrorApi) {
    super(error.mensaje);
  }
}

/**
 * `clave`: Idempotency-Key. Los formularios que crean algo mandan una por
 * formulario abierto, para que un doble toque no cree dos veces lo mismo.
 */
export async function llamar<T = unknown>(metodo: "GET" | "POST" | "PATCH" | "DELETE", ruta: string, cuerpo?: unknown, o: { clave?: string } = {}): Promise<T> {
  let r: Response;
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers["content-type"] = "application/json";
  if (o.clave) headers["idempotency-key"] = o.clave;
  try {
    r = await fetch(`/api/crm/v1${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new FalloApi(0, { codigo: "red", mensaje: "No hay conexión con el servidor. Revisa internet y vuelve a intentar." });
  }
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new FalloApi(r.status, j?.error ?? { codigo: "interno", mensaje: `El servidor respondió ${r.status}.` });
  return j as T;
}

export const mensajeDe = (e: unknown) => (e instanceof FalloApi ? e.error.mensaje : "Algo falló. Vuelve a intentar.");
