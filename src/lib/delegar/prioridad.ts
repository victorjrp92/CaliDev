import type { RespuestasDelegar } from "@/lib/delegar/preguntas";

/**
 * Prioridad interna de un lead del formulario «delegar».
 *
 * Categorías y no puntos: la regla tiene que poder leerse y discutirse. Cada
 * resultado lleva su motivo en palabras, y el panel lo enseña junto al lead.
 *
 * Solo miran lo que la persona DECLARÓ: qué busca y cuándo. El tamaño, el país
 * o las herramientas son contexto para la conversación, no una nota — que
 * alguien use Excel no dice nada de si va a contratar.
 *
 * El encaje no se decide aquí. Siempre queda «pendiente de revisar»: dirigir
 * una empresa no demuestra que el servicio le sirva, y esa inferencia la hace
 * una persona leyendo las respuestas.
 *
 * Nada de esto se enseña nunca al visitante.
 */

export type Prioridad = "alta" | "media" | "exploracion" | "incompleta";

export type ResultadoPrioridad = { prioridad: Prioridad; motivo: string };

export function prioridadDe(r: RespuestasDelegar, completo: boolean): ResultadoPrioridad {
  if (!completo) {
    return {
      prioridad: "incompleta",
      motivo: "Dejó su contacto pero no terminó el paso 3. Falta información, no es una baja.",
    };
  }
  if (r.busca === "conocer") {
    return { prioridad: "exploracion", motivo: "Por ahora solo quiere conocer cómo funciona." };
  }
  if (r.busca === "contratar" && r.plazo === "30d") {
    return {
      prioridad: "alta",
      motivo: "Quiere evaluar para contratar y actuar en 30 días. Confirmar alcance, quién decide e inversión.",
    };
  }
  if (r.busca === "contratar") {
    return { prioridad: "media", motivo: "Quiere evaluar para contratar, con un plazo más largo o sin fecha." };
  }
  return { prioridad: "media", motivo: "Quiere entender opciones y costos antes de decidir." };
}
