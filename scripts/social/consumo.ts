import { sql } from "../../src/lib/db";
async function main() {
  const { rows: c } = await sql`SELECT servicio, llamadas FROM social_consumo WHERE mes = to_char(NOW(),'YYYY-MM') ORDER BY llamadas DESC`;
  console.log("consumo del mes:", c.map((r) => `${r.servicio}=${r.llamadas}`).join(" "));
  const { rows: m } = await sql`
    SELECT to_char(date_trunc('hour', medido_en),'DD HH24:00') h, COUNT(*) n
    FROM social_metricas WHERE medido_en > NOW() - INTERVAL '20 hours' GROUP BY 1 ORDER BY 1 DESC LIMIT 8`;
  console.log("mediciones de métricas por hora:"); for (const r of m) console.log("  ", r.h, "→", r.n, "publicaciones");
  const { rows: t } = await sql`SELECT COUNT(*) n FROM social_metricas WHERE medido_en > NOW() - INTERVAL '20 hours'`;
  console.log("total mediciones en 20 h:", t[0].n);
  const { rows: a } = await sql`SELECT clave, valor FROM social_ajustes WHERE clave IN ('pausado','simulacion','ultimo_ciclo','chats_sync')`;
  console.log("ajustes:", a.map((r) => `${r.clave}=${r.valor}`).join(" "));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
