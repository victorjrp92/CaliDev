import { indicativoPorIso } from "@/lib/indicativos";

/**
 * Validación del WhatsApp según el país elegido.
 *
 * No hay una sola longitud válida: Colombia, México y los países del +1 usan
 * diez dígitos, Alemania entre diez y once, Uruguay ocho. Imponer la misma a
 * todos bloquea a quien tiene un número correcto de otro país. Para los países
 * sin regla propia se acepta un rango amplio y se deja la comprobación final a
 * la conversación.
 */
const LONGITUD: Record<string, [number, number]> = {
  CO: [10, 10],
  MX: [10, 10],
  US: [10, 10],
  CA: [10, 10],
  PR: [10, 10],
  DO: [10, 10],
  ES: [9, 9],
  DE: [10, 11],
};
const LONGITUD_GENERAL: [number, number] = [7, 13];

/**
 * Deja solo los dígitos del número nacional.
 *
 * Quien pega su número suele traer el indicativo delante («+57 300…» o
 * «0057 300…»): si los dígitos empiezan por él y sobran, se quita, para que no
 * quede duplicado. También se quita el cero de larga distancia nacional.
 */
export function numeroNacional(iso: string, texto: string): string {
  let digitos = texto.replace(/\D/g, "");
  const ind = indicativoPorIso(iso);
  const [, max] = LONGITUD[iso] ?? LONGITUD_GENERAL;

  if (ind) {
    const prefijo = ind.codigo.replace("+", "");
    if (digitos.startsWith("00" + prefijo)) digitos = digitos.slice(2 + prefijo.length);
    else if (digitos.startsWith(prefijo) && digitos.length > max) digitos = digitos.slice(prefijo.length);
  }
  return digitos.replace(/^0+/, "");
}

/** Mensaje de error para mostrar junto al campo, o `null` si el número sirve. */
export function errorDeNumero(iso: string, texto: string): string | null {
  const digitos = numeroNacional(iso, texto);
  if (!digitos) return "Escribe tu número de WhatsApp.";

  const [min, max] = LONGITUD[iso] ?? LONGITUD_GENERAL;
  const pais = indicativoPorIso(iso)?.pais ?? "ese país";

  if (iso === "CO" && digitos.length === 10 && !digitos.startsWith("3")) {
    return "En Colombia los celulares empiezan por 3. Revisa el número.";
  }
  if (digitos.length < min || digitos.length > max) {
    const cuantos = min === max ? `${min} dígitos` : `entre ${min} y ${max} dígitos`;
    return `Para ${pais} el número tiene ${cuantos}, sin el indicativo. Tiene ${digitos.length}.`;
  }
  return null;
}
