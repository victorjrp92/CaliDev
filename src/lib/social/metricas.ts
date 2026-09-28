import { sql } from "@/lib/db";
import { ajuste, asegurarEsquema } from "./db";
import { metricas } from "./instagram";

/**
 * Una medición por publicación, empezando por la que lleva más tiempo sin
 * medir. Se guarda como serie: así se ve cómo evoluciona, no solo la foto.
 *
 * Dos ritmos, porque cada medición es una llamada a Composio y medir un reel
 * de agosto cada hora es gastar cuota sin aprender nada: cada hora las
 * publicaciones vivas (automatizadas o de los últimos 7 días), una vez al día
 * el resto. Y nada si el agente está pausado: pausar significa que no se toca
 * Instagram.
 */
export async function medirPublicaciones() {
  await asegurarEsquema();
  if ((await ajuste("pausado")) === "1") return { pausado: true, medidas: 0 };
  const { rows } = await sql`
    SELECT p.media_id, p.tipo FROM social_publicaciones p
    LEFT JOIN social_automatizaciones a USING (media_id)
    LEFT JOIN LATERAL (SELECT MAX(medido_en) AS ultima FROM social_metricas m WHERE m.media_id = p.media_id) u ON TRUE
    WHERE u.ultima IS NULL
       OR (
            ((COALESCE(a.modo, 'apagado') <> 'apagado' OR p.publicado > NOW() - INTERVAL '7 days')
              AND u.ultima < NOW() - INTERVAL '50 minutes')
            OR u.ultima < NOW() - INTERVAL '24 hours'
          )
    ORDER BY u.ultima ASC NULLS FIRST
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
