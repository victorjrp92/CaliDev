// Comprueba que las métricas respetan la pausa y el nuevo ritmo.
import { sql } from "../../src/lib/db";
import { ajuste } from "../../src/lib/social/db";
import { medirPublicaciones } from "../../src/lib/social/metricas";
async function main() {
  console.log("pausado =", await ajuste("pausado"));
  console.log("con pausa →", JSON.stringify(await medirPublicaciones()));
  // Cuáles tocaría medir si estuviera activo (sin llamar a Instagram).
  const { rows } = await sql`
    SELECT p.media_id, COALESCE(a.modo,'apagado') modo, to_char(p.publicado,'DD Mon') pub,
      to_char(u.ultima, 'DD HH24:MI') ultima,
      (u.ultima IS NULL OR (((COALESCE(a.modo,'apagado') <> 'apagado' OR p.publicado > NOW() - INTERVAL '7 days')
        AND u.ultima < NOW() - INTERVAL '50 minutes') OR u.ultima < NOW() - INTERVAL '24 hours')) AS toca
    FROM social_publicaciones p LEFT JOIN social_automatizaciones a USING (media_id)
    LEFT JOIN LATERAL (SELECT MAX(medido_en) ultima FROM social_metricas m WHERE m.media_id = p.media_id) u ON TRUE
    ORDER BY toca DESC, u.ultima`;
  for (const r of rows) console.log(` ${r.toca ? "SÍ" : "no"}  ${r.media_id} modo=${r.modo} pub=${r.pub} última=${r.ultima}`);
  console.log("→ por hora se medirían:", rows.filter((r) => r.toca).length, "de", rows.length);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
