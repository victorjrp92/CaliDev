import { pedir } from "../lib/api.ts";
import { type Args, soloBanderas } from "../lib/args.ts";
import { type Resultado, tabla } from "../lib/salida.ts";

export const AYUDA = "calidev api                          Lista de endpoints de /api/crm/v1 con su permiso";

type Endpoint = { metodo: string; ruta: string; permiso: string; hace: string; cuerpo?: string };

export async function api(a: Args): Promise<Resultado> {
  soloBanderas(a, []);
  const { cuerpo } = await pedir<{ version: string; endpoints: Endpoint[] }>("");
  const filas = cuerpo.endpoints.map((e) => [e.metodo, e.ruta.replace("/api/crm/v1", "") || "/", e.permiso, e.hace + (e.cuerpo ? `  ${e.cuerpo}` : "")]);
  return { datos: cuerpo, texto: `API ${cuerpo.version} (base /api/crm/v1)\n\n${tabla(["MÉTODO", "RUTA", "PERMISO", "HACE"], filas, 200)}` };
}
