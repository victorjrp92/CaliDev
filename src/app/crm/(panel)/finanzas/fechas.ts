import { fecha, paraInputFecha } from "@/lib/crm/formato";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export const mesValido = (v: string) => MES.test(v);

/** El mes calendario de hoy en Colombia, «AAAA-MM». */
export const mesActual = () => paraInputFecha(new Date()).slice(0, 7);

/** El mes `delta` meses antes (negativo) o después de `mes`. */
export function mesVecino(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** «noviembre de 2026». */
export const nombreMes = (mes: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T00:00:00Z`));

/** Un día suelto «AAAA-MM-DD» (vence, fecha del gasto) sin que la zona lo corra al día anterior. */
export const fechaDia = (d: string | null) => (d ? fecha(`${d}T12:00:00-05:00`) : "—");
