import { primerNombre } from "@/lib/delegar/correos/lead";

/**
 * Sesiones de Dirección Estratégica: las horas de trabajo con un cliente que
 * vienen incluidas en su contrato. No son ventas, así que no llevan «gratuita»
 * ni pasan por el embudo del panel.
 *
 * Cada sesión es una cita propia (`tipo` = «sesion»), con sus horarios, su
 * token y su evento de calendario; `mensaje` guarda cuál es («Sesión 1 de 3»).
 */
export const NOMBRE_SESIONES = "Sesiones de Dirección Estratégica";
export const NOMBRE_PROGRAMA = "Dirección Estratégica";

type ConTipo = { tipo?: string | null };

export function esSesion(cita: ConTipo): boolean {
  return cita.tipo === "sesion";
}

/** «Sesión 1 de 3». */
export function rotuloSesion(cita: { mensaje?: string | null }): string {
  return cita.mensaje?.trim() || "Sesión";
}

/** Con clientes va el nombre con el que los conocemos («María José», no «María»). */
export function nombreSaludo(cita: ConTipo & { nombre: string }): string {
  return esSesion(cita) ? cita.nombre : primerNombre(cita.nombre);
}
