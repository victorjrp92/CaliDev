import { sql } from "@/lib/db";

/**
 * La nota que las clientas le pusieron a Cali Dev.
 *
 * Sale de la tabla `opiniones`, que se llena por el enlace privado de
 * `/opinion`. Antes era una constante en este archivo y eso tenía un fallo
 * evidente en cuanto llegó la primera nota: había que acordarse de venir a
 * cambiarla a mano. Leyéndola de la base, la banda se actualiza sola según
 * vayan contestando.
 *
 * Solo cuentan las que dieron permiso para publicar. Quien califica sin marcar
 * la casilla nos está diciendo lo que piensa, no autorizando a enseñarlo.
 *
 * Si la consulta falla —base caída, tabla que todavía no existe— devuelve
 * `null` y la banda se queda sin estrellas. Una portada no se cae porque no se
 * pueda leer una nota.
 */
export type Valoracion = {
  /** Media real, un decimal. */
  media: number;
  /** Cuántas personas la pusieron. Va SIEMPRE junto a la media. */
  personas: number;
};

/**
 * Se revalida cada hora. Las notas llegan de tres personas a lo largo de unos
 * días: consultar la base en cada visita sería pagar un viaje por cada carga de
 * la portada para un número que casi nunca cambia.
 */
export const revalidate = 3600;

export async function obtenerValoracion(): Promise<Valoracion | null> {
  try {
    const r = await sql`
      SELECT ROUND(AVG(nota)::numeric, 1) AS media, COUNT(*)::int AS personas
      FROM opiniones
      WHERE permiso = TRUE
    `;
    const fila = r.rows[0];
    const personas = Number(fila?.personas ?? 0);
    const media = Number(fila?.media ?? 0);
    if (!personas || !media) return null;
    return { media, personas };
  } catch {
    return null;
  }
}
