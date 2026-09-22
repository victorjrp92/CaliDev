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
 * Cuentan TODAS las notas, con permiso o sin él, y eso no es un descuido: es lo
 * que el formulario promete con estas palabras — «si no lo marcas, tu nota
 * cuenta igual y tu nombre no sale». La primera versión filtraba por permiso y
 * contradecía esa frase; de tres clientas que pusieron cinco, la página
 * enseñaba una. Prometer una cosa en el formulario y hacer otra en la consulta
 * es mentir en la letra pequeña.
 *
 * El permiso gobierna el NOMBRE, que es lo que se preguntó: publicar «Laura
 * Sánchez, 5 estrellas» necesita su sí; contar su cinco dentro de una media
 * anónima, no.
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

export async function obtenerValoracion(): Promise<Valoracion | null> {
  try {
    const r = await sql`
      SELECT ROUND(AVG(nota)::numeric, 1) AS media, COUNT(*)::int AS personas
      FROM opiniones
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
