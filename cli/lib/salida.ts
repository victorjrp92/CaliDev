/**
 * Formato legible para Victor y Karen. Las horas salen en la zona del equipo
 * donde corre el CLI (Frankfurt para Victor, Colombia para Karen); el día de
 * agenda lo decide el servidor en hora de Colombia.
 */

/** Lo que devuelve cada comando: los datos crudos para --json y el texto para humanos. */
export type Resultado = { datos: unknown; texto: string; pendiente?: boolean };

const fmtFechaHora = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const fmtHora = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDia = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

const valida = (v: string | null | undefined) => (v ? new Date(v) : null);

export function fechaHora(v: string | null | undefined): string {
  const d = valida(v);
  return d && !Number.isNaN(d.getTime()) ? fmtFechaHora.format(d) : "—";
}

export function hora(v: string | null | undefined): string {
  const d = valida(v);
  return d && !Number.isNaN(d.getTime()) ? fmtHora.format(d) : "—";
}

/** Fecha sin hora. Un AAAA-MM-DD suelto se muestra tal cual (no se corre de día por la zona). */
export function dia(v: string | null | undefined): string {
  if (!v) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : fmtDia.format(d);
}

export function pesos(v: string | number | null | undefined, moneda = "COP"): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `${moneda} ${n.toLocaleString("es-CO", { maximumFractionDigits: moneda === "COP" ? 0 : 2 })}` : String(v);
}

/** Tabla en columnas alineadas. Las celdas largas se recortan con «…». */
export function tabla(cabecera: string[], filas: (string | number | null | undefined)[][], max = 48): string {
  if (!filas.length) return "(nada)";
  const celdas = [cabecera, ...filas.map((f) => f.map((c) => recortar(c === null || c === undefined ? "—" : String(c), max)))];
  const anchos = cabecera.map((_, i) => Math.max(...celdas.map((f) => (f[i] ?? "").length)));
  return celdas
    .map((f) => f.map((c, i) => (i === f.length - 1 ? c : c.padEnd(anchos[i]))).join("  ").trimEnd())
    .join("\n");
}

export function recortar(s: string, max: number): string {
  const una = s.replace(/\s+/g, " ").trim();
  return una.length > max ? `${una.slice(0, max - 1)}…` : una;
}

/** Pares «etiqueta: valor» alineados. */
export function ficha(pares: [string, string | number | null | undefined][]): string {
  const ancho = Math.max(...pares.map(([k]) => k.length));
  return pares.map(([k, v]) => `${`${k}:`.padEnd(ancho + 1)} ${v === null || v === undefined || v === "" ? "—" : v}`).join("\n");
}

/** Día de agenda (en hora de Colombia, como lo cuenta el servidor). */
const fmtDiaColombia = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric" });
export const diaAgenda = (v: string) => fmtDiaColombia.format(new Date(v));

/** Zona en que salen las horas (la del equipo). */
export const zonaLocal = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const titulo = (s: string) => `\n${s}\n${"─".repeat(Math.min(s.length, 60))}`;
