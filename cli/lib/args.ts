import { errorUso } from "./errores.ts";

/**
 * Argumentos de la línea de comandos: posicionales y banderas `--x valor`,
 * `--x=valor` o `--x` (booleana). Solo se aceptan las banderas que el comando
 * declara: una mal escrita es error de uso, no un valor ignorado en silencio.
 */
export type Args = {
  pos: string[];
  flags: Map<string, string | true>;
};

/** Banderas que valen en cualquier comando. */
export const BANDERAS_GLOBALES = ["json", "idempotency-key", "ayuda"];

/** Banderas que nunca llevan valor. */
const BOOLEANAS = new Set(["json", "ayuda", "mia", "semana", "abiertas", "vencidas", "cancelar", "mora"]);

export function leerArgs(argv: string[]): Args {
  const pos: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      pos.push(...argv.slice(i + 1));
      break;
    }
    if (a === "-h") {
      flags.set("ayuda", true);
      continue;
    }
    if (!a.startsWith("--")) {
      pos.push(a);
      continue;
    }
    const igual = a.indexOf("=");
    const nombre = igual > 0 ? a.slice(2, igual) : a.slice(2);
    if (igual > 0) flags.set(nombre, a.slice(igual + 1));
    else if (BOOLEANAS.has(nombre)) flags.set(nombre, true);
    else {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw errorUso(`--${nombre} necesita un valor.`, nombre);
      flags.set(nombre, v);
      i++;
    }
  }
  return { pos, flags };
}

/** Falla si hay banderas que el comando no conoce. */
export function soloBanderas(a: Args, permitidas: string[]) {
  const ok = new Set([...permitidas, ...BANDERAS_GLOBALES]);
  for (const k of a.flags.keys()) if (!ok.has(k)) throw errorUso(`Bandera desconocida: --${k}.`, k);
}

export function bandera(a: Args, nombre: string): string | undefined {
  const v = a.flags.get(nombre);
  if (v === true) throw errorUso(`--${nombre} necesita un valor.`, nombre);
  return v;
}

export const activa = (a: Args, nombre: string) => a.flags.has(nombre);

export function banderaReq(a: Args, nombre: string): string {
  const v = bandera(a, nombre);
  if (v === undefined || !v.trim()) throw errorUso(`Falta --${nombre}.`, nombre);
  return v;
}

/** Posicional obligatorio número `i` (sin contar comando y subcomando). */
export function posReq(a: Args, i: number, nombre: string): string {
  const v = a.pos[i];
  if (v === undefined || !v.trim()) throw errorUso(`Falta <${nombre}>.`, nombre);
  return v;
}

/** Id numérico positivo. */
export function id(v: string, nombre = "id"): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw errorUso(`<${nombre}> debe ser un entero positivo (llegó «${v}»).`, nombre);
  return n;
}

/** Fecha AAAA-MM-DD (o fecha y hora ISO): el servidor la valida del todo. */
export function fecha(v: string, nombre = "fecha"): string {
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}.*)?$/.test(v)) throw errorUso(`--${nombre} va como AAAA-MM-DD (llegó «${v}»).`, nombre);
  return v;
}

/**
 * Monto entero en pesos: acepta 2.500.000, 2,500,000, 2 500 000 o 2500000. El separador
 * solo vale en grupos de tres: «10.5» es un error, no 105 pesos.
 */
export function monto(v: string, nombre: string): number {
  const t = v.trim();
  const n = Number(t.replace(/[.,_\s]/g, ""));
  if (!/^(\d+|\d{1,3}([.,_\s]\d{3})+)$/.test(t) || !Number.isSafeInteger(n)) throw errorUso(`--${nombre} debe ser un monto entero en pesos (llegó «${v}»).`, nombre);
  return n;
}
