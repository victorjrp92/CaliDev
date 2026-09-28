/**
 * Horarios de las videollamadas de diagnóstico.
 *
 * Víctor ofrece citas de una hora, miércoles, jueves y viernes de 8:00 a 11:00
 * en hora de Colombia. Víctor vive en Frankfurt: cada horario se escribe con
 * su desfase (-05:00) para que no dependa de la zona del servidor ni de la de
 * quien lo lea. Para abrir otra semana basta con cambiar esta lista.
 *
 * El `id` es lo que viaja en los enlaces del correo: corto, legible y estable.
 */

export const DURACION_MINUTOS = 60;
export const ZONA_COLOMBIA = "America/Bogota";
export const ZONA_VICTOR = "Europe/Berlin";
export const ENLACE_VIDEOLLAMADA = "https://meet.google.com/gep-oaey-gwj";

/** Con menos de esto de antelación un horario deja de ofrecerse. */
const ANTELACION_MINIMA_MS = 60 * 60 * 1000;

const DIAS = ["2026-09-30", "2026-10-01", "2026-10-02"];
const HORAS = ["08", "09", "10"];

export type Horario = { id: string; inicio: Date; fin: Date };

export const HORARIOS: Horario[] = DIAS.flatMap((dia) =>
  HORAS.map((hora) => {
    const inicio = new Date(`${dia}T${hora}:00:00-05:00`);
    return {
      id: `${dia}T${hora}`,
      inicio,
      fin: new Date(inicio.getTime() + DURACION_MINUTOS * 60 * 1000),
    };
  })
);

export function horarioPorId(id: string | null | undefined): Horario | undefined {
  return HORARIOS.find((h) => h.id === id);
}

export function horarioPorInicio(inicio: Date | string | null): Horario | undefined {
  if (!inicio) return undefined;
  const t = new Date(inicio).getTime();
  return HORARIOS.find((h) => h.inicio.getTime() === t);
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
