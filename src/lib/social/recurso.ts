import { normalizar } from "./reglas";
import type { Paso } from "./tipos";

/**
 * Lógica pura del flujo «recurso» (comenta X → te envío Y). Ver Recurso en
 * tipos.ts. Lo que no es un toque del botón (una pregunta, un mensaje largo)
 * va a la bandeja de Por atender, pero la persona sigue en el flujo: puede
 * tocar el botón después, y si comenta otro video recibe ese recurso también.
 */

export type DecisionRecurso =
  | { tipo: "entregar"; paso: "recurso_enviado" }
  | { tipo: "pedir_seguir"; paso: "esperando_seguir" }
  | { tipo: "reintento"; paso: "esperando_seguir_2" }
  | { tipo: "bandeja" };

export const PASOS_RECURSO: Paso[] = ["esperando_recurso", "esperando_seguir", "esperando_seguir_2", "recurso_enviado"];

const AFIRMACIONES = new Set(["si", "dale", "listo", "ya", "ok", "okay", "quiero", "enviamelo", "envialo", "porfa", "gracias"]);

/** ¿Es un toque del botón? Los botones llegan como texto. Se acepta también
 * una respuesta corta sin signo de pregunta («listo», «ya», 👍). */
export function esToque(texto: string, botones: string[]): boolean {
  const n = normalizar(texto);
  if (botones.some((b) => normalizar(b) === n) || AFIRMACIONES.has(n)) return true;
  return !texto.includes("?") && n.split(" ").filter(Boolean).length <= 4;
}

/** ¿Hay que preguntarle a Instagram si sigue la cuenta? Solo cuando la respuesta cambia algo. */
export function necesitaSaberSiSigue(paso: Paso, exigirSeguir: boolean): boolean {
  return exigirSeguir && (paso === "esperando_recurso" || paso === "esperando_seguir");
}

export function decidirRecurso(paso: Paso, toque: boolean, exigirSeguir: boolean, sigue: boolean | null): DecisionRecurso {
  if (!toque || paso === "recurso_enviado" || !PASOS_RECURSO.includes(paso)) return { tipo: "bandeja" };
  const entregar = { tipo: "entregar", paso: "recurso_enviado" } as const;
  if (paso === "esperando_seguir_2" || !exigirSeguir) return entregar;
  if (sigue === null) throw new Error("Falta saber si la persona sigue la cuenta");
  if (sigue) return entregar;
  return paso === "esperando_recurso"
    ? { tipo: "pedir_seguir", paso: "esperando_seguir" }
    : { tipo: "reintento", paso: "esperando_seguir_2" };
}
