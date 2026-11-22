import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { errorUso } from "./errores.ts";

/** Todo lo que llega por stdin (`calidev nota agregar … < brief.md`). Vacío si stdin es una terminal. */
export async function leerStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const partes: Buffer[] = [];
  for await (const p of process.stdin) partes.push(p as Buffer);
  return Buffer.concat(partes).toString("utf8");
}

/** JSON de stdin (payload de una aprobación). Vacío → `vacio`. */
export async function jsonDeStdin(campo: string, vacio: unknown = undefined): Promise<unknown> {
  const t = (await leerStdin()).trim();
  if (!t) return vacio;
  try {
    return JSON.parse(t);
  } catch (e) {
    throw errorUso(`${campo}: stdin no es JSON válido (${(e as Error).message}).`, campo);
  }
}

/** Pregunta en la terminal sin mostrar lo que se escribe (para la clave). */
export function preguntarOculto(pregunta: string): Promise<string> {
  process.stderr.write(pregunta);
  const mudo = new Writable({ write: (_c, _e, cb) => cb() });
  const rl = createInterface({ input: process.stdin, output: mudo, terminal: true });
  return new Promise((resolver) => {
    rl.question("", (r) => {
      rl.close();
      process.stderr.write("\n");
      resolver(r.trim());
    });
  });
}
