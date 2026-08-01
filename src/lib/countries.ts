/**
 * Países para el selector del filtro.
 *
 * Aparece solo cuando la visitante elige "otro país de Latinoamérica" u "otro
 * país": saber cuál es determina si el producto listo aplica o si hay que
 * construir a medida, y eso cambia cómo se prepara la llamada.
 */

export const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
];

export const OTHER_COUNTRIES = [
  "Alemania",
  "Australia",
  "Austria",
  "Bélgica",
  "Canadá",
  "Dinamarca",
  "España",
  "Estados Unidos",
  "Francia",
  "Irlanda",
  "Italia",
  "Noruega",
  "Países Bajos",
  "Portugal",
  "Reino Unido",
  "Suecia",
  "Suiza",
];

/** Qué lista mostrar según la respuesta de país. */
export function countryListFor(country: string | undefined): string[] | null {
  if (country === "latam") return LATAM_COUNTRIES;
  if (country === "otro") return OTHER_COUNTRIES;
  return null;
}
