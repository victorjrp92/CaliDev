/**
 * La nota que las clientas le pusieron a Cali Dev.
 *
 * `null` mientras no haya ninguna de verdad, y ese es todo el punto de que esto
 * viva en un archivo aparte: la banda del home enseña estrellas SOLO si aquí
 * hay un número, así que no hay forma de publicar una puntuación inventada por
 * descuido.
 *
 * Deisy, Nadia y Laura escribieron una cita cada una; ninguna puso una nota.
 * Una cita elogiosa no es un cinco: el cinco lo pone quien califica, no quien
 * lo lee. Y aquí las caras y los nombres son reales, así que una nota que nadie
 * dio no es un adorno optimista — es ponerle palabras a una clienta.
 *
 * Se llena cuando contesten el formulario de /opinion, con la media REAL y el
 * número de personas al lado. Si sale 4,7 se publica 4,7: un cinco perfecto sin
 * fuente se lee como inventado, y un 4,7 con el número de personas se cree.
 */
export type Valoracion = {
  /** Media real, un decimal. */
  media: number;
  /** Cuántas personas la pusieron. Va SIEMPRE junto a la media. */
  personas: number;
};

export const VALORACION: Valoracion | null = null;
