import { sql } from "@/lib/db";
import { asegurarEsquema } from "./db";
import { metricas } from "./instagram";

/**
 * Una medición por publicación, empezando por la que lleva más tiempo sin
 * medir. Se guarda como serie: así se ve cómo evoluciona, no solo la foto.
 * Tope de 8 por ejecución (una llamada de ~4 s cada una) para caber en el
 * tiempo de Hobby. Con el reloj cada hora, todas quedan al día en 2 horas.
 */
export async function medirPublicaciones() {
  await asegurarEsquema();
  const { rows } = await sql`
    SELECT p.media_id, p.tipo FROM social_publicaciones p
    ORDER BY (SELECT MAX(medido_en) FROM social_metricas m WHERE m.media_id = p.media_id) ASC NULLS FIRST
    LIMIT 8`;
  let medidas = 0;
  for (const { media_id, tipo } of rows) {
    const m = await metricas(media_id, tipo).catch(() => ({} as Record<string, number>));
    if (!Object.keys(m).length) continue;
    await sql`
      INSERT INTO social_metricas (media_id, vistas, alcance, skip_rate, tiempo_promedio_ms, guardados, compartidos, me_gusta, comentarios)
      VALUES (${media_id}, ${m.views ?? null}, ${m.reach ?? null}, ${m.reels_skip_rate ?? null}, ${m.ig_reels_avg_watch_time ?? null},
        ${m.saved ?? null}, ${m.shares ?? null}, ${m.likes ?? null}, ${m.comments ?? null})`;
    medidas++;
  }
  return { medidas };
}
