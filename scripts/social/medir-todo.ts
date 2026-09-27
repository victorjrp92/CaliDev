import { medirPublicaciones } from "../../src/lib/social/metricas";
import { sql } from "../../src/lib/db";
async function main() {
  const t = Date.now();
  console.log("corrida 1:", JSON.stringify(await medirPublicaciones()), Math.round((Date.now() - t) / 1000), "s");
  console.log("corrida 2:", JSON.stringify(await medirPublicaciones()));
  const { rows } = await sql`SELECT DISTINCT ON (media_id) media_id, vistas, alcance, skip_rate, tiempo_promedio_ms, guardados FROM social_metricas ORDER BY media_id, medido_en DESC`;
  for (const r of rows) console.log(" ", r.media_id, "vistas", r.vistas, "alcance", r.alcance, "skip", r.skip_rate, "avg_ms", r.tiempo_promedio_ms);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
