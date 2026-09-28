// ¿Qué se mediría dentro de 1 h, 6 h y 25 h? Misma condición, con un "ahora" desplazado.
import { sql } from "../../src/lib/db";
async function main() {
  for (const h of [1, 6, 25]) {
    const { rows } = await sql`
      SELECT COUNT(*) FILTER (WHERE
        u.ultima IS NULL OR (
          ((COALESCE(a.modo,'apagado') <> 'apagado' OR p.publicado > (NOW() + (${h} || ' hours')::interval) - INTERVAL '7 days')
            AND u.ultima < (NOW() + (${h} || ' hours')::interval) - INTERVAL '50 minutes')
          OR u.ultima < (NOW() + (${h} || ' hours')::interval) - INTERVAL '24 hours')) AS tocan,
        COUNT(*) AS total
      FROM social_publicaciones p LEFT JOIN social_automatizaciones a USING (media_id)
      LEFT JOIN LATERAL (SELECT MAX(medido_en) ultima FROM social_metricas m WHERE m.media_id = p.media_id) u ON TRUE`;
    console.log(`dentro de ${String(h).padStart(2)} h → se medirían ${rows[0].tocan} de ${rows[0].total}`);
  }
  const { rows: v } = await sql`SELECT COUNT(*) n FROM social_metricas WHERE medido_en > NOW() - INTERVAL '24 hours'`;
  console.log("mediciones en las últimas 24 h (ritmo viejo):", v[0].n);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
