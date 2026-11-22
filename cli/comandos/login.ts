import { pedir } from "../lib/api.ts";
import { type Args, bandera, soloBanderas } from "../lib/args.ts";
import { guardarConfig, limpiarUrl, rutaConfig, URL_POR_DEFECTO } from "../lib/config.ts";
import { leerStdin, preguntarOculto } from "../lib/entrada.ts";
import { errorUso } from "../lib/errores.ts";
import type { Resultado } from "../lib/salida.ts";
import { describirYo, type Yo } from "./yo.ts";

export const AYUDA = "calidev login [--url https://calidev.dev]   Guarda la clave cdv_… (la pide, o la lee de stdin)";

/**
 * Pega la clave y la comprueba contra /yo antes de guardarla: una clave mal
 * copiada no llega al archivo. Nunca se acepta como argumento, para que no
 * quede en el historial de la terminal.
 */
export async function login(a: Args): Promise<Resultado> {
  soloBanderas(a, ["url"]);
  if (a.pos.length) throw errorUso("La clave no va como argumento (quedaría en el historial). Pégala cuando la pida o pásala por stdin.");
  const url = limpiarUrl(bandera(a, "url") ?? URL_POR_DEFECTO);
  if (!/^https?:\/\/[^\s/]+/.test(url)) throw errorUso(`--url no parece una URL: «${url}».`, "url");

  const clave = process.stdin.isTTY ? await preguntarOculto("Clave del CRM (cdv_…): ") : (await leerStdin()).trim();
  if (!clave.startsWith("cdv_")) throw errorUso("La clave empieza por cdv_. Créala en Agentes → Claves del CRM.", "clave");

  const config = { url, clave };
  const { cuerpo } = await pedir<Yo>("/yo", { config });
  guardarConfig(config);
  return { datos: { ...cuerpo, config: rutaConfig() }, texto: `Clave guardada en ${rutaConfig()}.\n\n${describirYo(cuerpo, url)}` };
}
