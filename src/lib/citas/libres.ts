import { disponibleAun, horarioDesdeId, type Horario } from "@/lib/citas/horarios";

/**
 * Horarios de la agenda pública (calidev.dev/agendar), a la que llega quien
 * escribe desde Instagram: miércoles, jueves y viernes de 8 a 11 a. m. de
 * Colombia, las próximas dos semanas. Son los que Victor fijó para las
 * videollamadas gratuitas.
 *
 * Las horas ya tomadas por otra cita se quitan al pintar la página; la base
 * de datos impide igual que dos personas reserven la misma (índice único).
 */
const DIAS_SEMANA = new Set([3, 4, 5]); // miércoles, jueves, viernes
const HORAS = ["08", "09", "10"];
const DIAS_ADELANTE = 14;

/** «2026-10-21» de hoy + `n` días, en Colombia. */
function diaColombia(n: number, ahora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(ahora.getTime() + n * 86_400_000));
}

export function horariosAgendaPublica(ahora = new Date()): Horario[] {
  const lista: Horario[] = [];
  for (let n = 0; n <= DIAS_ADELANTE; n++) {
    const dia = diaColombia(n, ahora);
    if (!DIAS_SEMANA.has(new Date(`${dia}T12:00:00Z`).getUTCDay())) continue;
    for (const h of HORAS) {
      const horario = horarioDesdeId(`${dia}T${h}`);
      if (horario && disponibleAun(horario, ahora)) lista.push(horario);
    }
  }
  return lista;
}
