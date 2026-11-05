/**
 * Horarios de las videollamadas de diagnóstico.
 *
 * Citas de una hora en hora de Colombia. Víctor vive en Frankfurt: cada
 * horario se construye con el desfase de Colombia (-05:00, sin horario de
 * verano) para que no dependa de la zona del servidor ni de quien lo lea.
 *
 * Los horarios los elige Víctor en el panel para cada invitación y se guardan
 * con la cita. `HORARIOS` es solo la lista con la que salieron las primeras
 * invitaciones, antes del selector: las citas sin horarios propios la usan.
 *
 * El `id` («2026-10-01T09») es lo que viaja en los enlaces del correo: corto,
 * legible y estable.
 */
import type { Cita } from "@/lib/citas/datos";

export const DURACION_MINUTOS = 60;
export const ZONA_COLOMBIA = "America/Bogota";
export const ZONA_VICTOR = "Europe/Berlin";
export const ENLACE_VIDEOLLAMADA = "https://meet.google.com/gep-oaey-gwj";

/** Con menos de esto de antelación un horario deja de ofrecerse. */
const ANTELACION_MINIMA_MS = 60 * 60 * 1000;

const DIAS = ["2026-09-30", "2026-10-01", "2026-10-02"];
const HORAS = ["08", "09", "10"];

export type Horario = { id: string; inicio: Date; fin: Date };

/** Horas que el panel deja ofrecer, en hora de Colombia: de 6 a. m. a 8 p. m. */
export const PRIMERA_HORA = 6;
export const ULTIMA_HORA = 20;
/** Hasta cuántos días adelante se puede ofrecer una cita. */
export const DIAS_ADELANTE = 21;

const FORMATO_ID = /^(\d{4}-\d{2}-\d{2})T(\d{2})$/;

/**
 * Tres tipos de cita: la primera videollamada (diagnóstico, 1 hora), la segunda
 * cita, donde se presenta la propuesta (30 minutos), y la sesión con un cliente
 * (1 hora, ver lib/citas/sesion.ts). El tipo cambia la duración y los textos de
 * los correos; los horarios y la reserva son iguales.
 */
export type TipoCita = "primera" | "segunda" | "sesion";

export function tipoDe(cita: { tipo?: string | null }): TipoCita {
  return cita.tipo === "segunda" || cita.tipo === "sesion" ? cita.tipo : "primera";
}

export function duracionDe(cita: { tipo?: string | null }): number {
  return tipoDe(cita) === "segunda" ? 30 : DURACION_MINUTOS;
}

/** «1 hora» o «30 minutos», para los textos. */
export function textoDuracion(cita: { tipo?: string | null }): string {
  return duracionDe(cita) === 60 ? "1 hora" : `${duracionDe(cita)} minutos`;
}

/** «2026-10-01T09» → el horario de 9:00 de Colombia, de `minutos` de duración. `undefined` si no es válido. */
export function horarioDesdeId(id: string | null | undefined, minutos = DURACION_MINUTOS): Horario | undefined {
  const m = FORMATO_ID.exec(id ?? "");
  if (!m) return undefined;
  const hora = Number(m[2]);
  if (hora < PRIMERA_HORA || hora > ULTIMA_HORA) return undefined;
  const inicio = new Date(`${m[1]}T${m[2]}:00:00-05:00`);
  if (Number.isNaN(inicio.getTime())) return undefined;
  return { id: id as string, inicio, fin: new Date(inicio.getTime() + minutos * 60 * 1000) };
}

export const HORARIOS: Horario[] = DIAS.flatMap((dia) =>
  HORAS.map((hora) => horarioDesdeId(`${dia}T${hora}`) as Horario)
);

/** Los horarios que se le ofrecieron a esta persona, en orden. */
export function horariosDeCita(cita: Pick<Cita, "horarios"> & { tipo?: string | null }): Horario[] {
  const minutos = duracionDe(cita);
  const propios = (cita.horarios ?? "")
    .split(",")
    .map((id) => horarioDesdeId(id.trim(), minutos))
    .filter((h): h is Horario => Boolean(h));
  const lista = propios.length ? propios : HORARIOS;
  return [...lista].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

/** El id del horario que empieza en esa fecha, en hora de Colombia. */
export function idDesdeInicio(inicio: Date | string | null): string | undefined {
  if (!inicio) return undefined;
  const d = new Date(new Date(inicio).getTime() - 5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 13);
}

export function horarioPorInicio(inicio: Date | string | null): Horario | undefined {
  return horarioDesdeId(idDesdeInicio(inicio));
}

/** La hora reservada de una cita, con la duración de su tipo. */
export function horarioDeCita(cita: Pick<Cita, "inicio"> & { tipo?: string | null }): Horario | undefined {
  return horarioDesdeId(idDesdeInicio(cita.inicio), duracionDe(cita));
}

export function disponibleAun(h: Horario, ahora = new Date()): boolean {
  return h.inicio.getTime() - ahora.getTime() > ANTELACION_MINIMA_MS;
}

const DIA_LARGO = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: ZONA_COLOMBIA,
});
const HORA = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: ZONA_COLOMBIA,
});
const HORA_VICTOR = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA_VICTOR,
});

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «Miércoles 30 de septiembre». */
export function diaDe(h: Horario): string {
  return mayuscula(DIA_LARGO.format(h.inicio));
}

/** «8:00 a. m.». */
export function horaDe(fecha: Date): string {
  return HORA.format(fecha);
}

const HORA_SOLA = new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: true, timeZone: ZONA_COLOMBIA });

/** «8 a. m.», «2 p. m.»: corta, para botones estrechos. Las citas empiezan en punto. */
export function horaCompacta(fecha: Date): string {
  return HORA_SOLA.format(fecha).replace(/\s+/g, " ").replace(/\u00a0/g, " ");
}

/** «Miércoles 30 de septiembre, 8:00 a. m. a 9:00 a. m. (hora de Colombia)». */
export function describir(h: Horario): string {
  return `${diaDe(h)}, ${horaDe(h.inicio)} a ${horaDe(h.fin)} (hora de Colombia)`;
}

/** La misma cita en la hora de Víctor, para su aviso: «15:00 en Frankfurt». */
export function horaEnFrankfurt(h: Horario): string {
  return `${HORA_VICTOR.format(h.inicio)} en Frankfurt`;
}

/** Los horarios agrupados por día, en orden, para pintarlos. */
export function porDia(lista: Horario[]): { dia: string; horarios: Horario[] }[] {
  const grupos: { dia: string; horarios: Horario[] }[] = [];
  for (const h of lista) {
    const dia = diaDe(h);
    const grupo = grupos.find((g) => g.dia === dia);
    if (grupo) grupo.horarios.push(h);
    else grupos.push({ dia, horarios: [h] });
  }
  return grupos;
}
