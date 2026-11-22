import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { ErrorCli, SALIDA } from "./errores.ts";

/**
 * Configuración en `~/.config/calidev/config.json` (spec §7): URL y clave.
 * `CALIDEV_CONFIG` cambia la ruta del archivo; `CALIDEV_URL` y `CALIDEV_CLAVE`
 * pisan su contenido (para agentes que corren sin home propio). El archivo se
 * escribe con permisos 0600: la clave da acceso al CRM.
 */
export type Config = { url: string; clave: string };

export const URL_POR_DEFECTO = "https://calidev.dev";

export const rutaConfig = () =>
  process.env.CALIDEV_CONFIG || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "calidev", "config.json");

function leerArchivo(): Partial<Config> {
  try {
    const c = JSON.parse(readFileSync(rutaConfig(), "utf8")) as Partial<Config>;
    return c && typeof c === "object" ? c : {};
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new ErrorCli(SALIDA.otro, "config_invalida", `No se pudo leer ${rutaConfig()}: ${(e as Error).message}. Vuelve a correr calidev login.`);
  }
}

export function leerConfig(): Config {
  const f = leerArchivo();
  const clave = process.env.CALIDEV_CLAVE || f.clave;
  if (!clave) throw new ErrorCli(SALIDA.otro, "sin_clave", "No hay clave. Crea una en calidev.dev/crm/agentes y corre: calidev login");
  return { url: limpiarUrl(process.env.CALIDEV_URL || f.url || URL_POR_DEFECTO), clave };
}

export const limpiarUrl = (u: string) => u.trim().replace(/\/+$/, "");

export function guardarConfig(c: Config) {
  const ruta = rutaConfig();
  mkdirSync(dirname(ruta), { recursive: true, mode: 0o700 });
  writeFileSync(ruta, JSON.stringify(c, null, 2) + "\n", { mode: 0o600 });
  chmodSync(ruta, 0o600); // si ya existía con otros permisos
}
