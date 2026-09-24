import type { RespuestasDelegar } from "@/lib/delegar/preguntas";
import { errorDeNumero } from "@/lib/delegar/telefono";

/**
 * Estado y validación del formulario «delegar», sin nada de interfaz.
 *
 * Cada error va con la clave del campo, que es también su `id` en la página
 * (los grupos de opciones usan `${id}-0`, su primera opción). El orden de las
 * claves es el orden en pantalla: el primero es a donde se lleva el foco.
 */

export type DatosDelegar = {
  respuestas: RespuestasDelegar;
  actividad: string;
  dolorOtro: string;
  herramientasOtro: string;
  nombre: string;
  iso: string;
  numero: string;
  correo: string;
  empresa: string;
};

export type Errores = Record<string, string>;

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function erroresPaso1(d: DatosDelegar): Errores {
  const e: Errores = {};
  if (!d.respuestas.rol) e["d-rol"] = "Elige el papel que tienes en el negocio.";
  if (d.respuestas.rol !== "ninguna") {
    if (d.actividad.trim().length < 2) e["d-actividad"] = "Cuéntanos a qué se dedica tu negocio.";
    if (!d.respuestas.dolor) e["d-dolor"] = "Elige qué necesitas resolver primero.";
    if (d.respuestas.dolor === "otro" && d.dolorOtro.trim().length < 3) {
      e["d-dolor-otro"] = "Describe brevemente el problema.";
    }
    if (!d.respuestas.tamano) e["d-tamano"] = "Elige cuántas personas trabajan en la operación.";
  }
  return e;
}

export function erroresPaso2(d: DatosDelegar): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 2) e["d-nombre"] = "Escribe tu nombre.";
  const numero = errorDeNumero(d.iso, d.numero);
  if (numero) e["d-numero"] = numero;
  if (d.correo.trim() && !CORREO_OK.test(d.correo.trim())) {
    e["d-correo"] = "Revisa el correo: falta la @ o el dominio (por ejemplo, maria@correo.com). También puedes dejarlo vacío.";
  }
  return e;
}

export function erroresPaso3(d: DatosDelegar): Errores {
  const e: Errores = {};
  const herramientas = d.respuestas.herramientas ?? "";
  if (!herramientas) e["d-herramientas"] = "Marca al menos una opción.";
  if (herramientas.split(",").includes("otro") && d.herramientasOtro.trim().length < 2) {
    e["d-herramientas-otro"] = "Cuéntanos qué otra cosa usas.";
  }
  if (!d.respuestas.busca) e["d-busca"] = "Elige qué buscas en esta conversación.";
  if (!d.respuestas.plazo) e["d-plazo"] = "Elige cuándo te gustaría implementar una mejora.";
  return e;
}

/** Los campos que son grupos de opciones: su foco va a la primera opción. */
const GRUPOS = new Set(["d-rol", "d-dolor", "d-tamano", "d-herramientas", "d-busca", "d-plazo"]);

export function idEnfocable(clave: string): string {
  return GRUPOS.has(clave) ? `${clave}-0` : clave;
}

/**
 * Los parámetros de campaña del enlace (utm_*), para guardarlos con el lead.
 * Solo esos: nunca datos personales en una URL.
 */
export function utmDeLaUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  const utm = [...params.entries()].filter(([k]) => k.startsWith("utm_"));
  return utm.length > 0 ? new URLSearchParams(utm).toString().slice(0, 300) : null;
}
