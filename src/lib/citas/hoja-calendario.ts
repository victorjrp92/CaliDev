import { ZONA_COLOMBIA, horaCompacta, type Horario } from "@/lib/citas/horarios";
import { C, FUENTE, MONO } from "@/lib/citas/estilo-correo";

/**
 * Los horarios de un correo como una hoja de calendario: una columna por día
 * con el número grande y las horas debajo, de tres en tres columnas. Cada hora
 * es un enlace a la página de la cita, donde se confirma.
 */
const DIA_CORTO = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: ZONA_COLOMBIA });
const NUMERO = new Intl.DateTimeFormat("es-CO", { day: "numeric", timeZone: ZONA_COLOMBIA });
const MES = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: ZONA_COLOMBIA });

export type ColumnaDia = { clave: string; horarios: Horario[] };

const limpiar = (s: string) => s.replace(".", "").toUpperCase();

export function columnas(lista: Horario[]): ColumnaDia[] {
  const grupos: ColumnaDia[] = [];
  for (const h of lista) {
    const clave = h.id.slice(0, 10);
    const g = grupos.find((x) => x.clave === clave);
    if (g) g.horarios.push(h);
    else grupos.push({ clave, horarios: [h] });
  }
  return grupos;
}

/** «MIÉ 11», para la versión de texto del correo. */
export function diaEnTexto(f: Date): string {
  return `${limpiar(DIA_CORTO.format(f))} ${NUMERO.format(f)}`;
}

function columnaDia(d: ColumnaDia, i: number, fila: unknown[], enlace: (id: string) => string): string {
  const f = d.horarios[0].inicio;
  const horas = d.horarios
    .map(
      (h) => `
        <tr><td style="padding:0 0 8px">
          <a href="${enlace(h.id)}" style="display:block;text-align:center;border:1.5px solid ${C.verde};border-radius:10px;padding:10px 4px;font-family:${FUENTE};font-size:14px;font-weight:700;color:${C.verde};text-decoration:none;background:#ffffff">${horaCompacta(h.inicio)}</a>
        </td></tr>`
    )
    .join("");
  return `
      <td width="33%" valign="top" style="padding:0 ${i < fila.length - 1 ? 6 : 0}px 0 ${i > 0 ? 6 : 0}px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.hueso};border:1px solid ${C.linea};border-radius:14px">
          <tr><td align="center" style="padding:12px 8px 10px;border-bottom:1px solid ${C.linea}">
            <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;color:${C.gris}">${limpiar(DIA_CORTO.format(f))}</div>
            <div style="font-family:${FUENTE};font-size:30px;line-height:1.1;font-weight:800;color:${C.tinta}">${NUMERO.format(f)}</div>
            <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.12em;color:${C.gris}">${limpiar(MES.format(f))}</div>
          </td></tr>
          <tr><td style="padding:10px 8px 2px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${horas}</table>
          </td></tr>
        </table>
      </td>`;
}

export function hojaCalendario(dias: ColumnaDia[], enlace: (id: string) => string): string {
  const filas: ColumnaDia[][] = [];
  for (let i = 0; i < dias.length; i += 3) filas.push(dias.slice(i, i + 3));
  return filas
    .map(
      (fila, n) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;${n > 0 ? "margin-top:12px" : ""}"><tr>${fila
          .map((d, i) => columnaDia(d, i, fila, enlace))
          .join("")}${"<td width=\"33%\"></td>".repeat(3 - fila.length)}</tr></table>`
    )
    .join("");
}
