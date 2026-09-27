import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`
    SELECT p.media_id, p.tipo, p.en_perfil, p.publicado, p.conteo_ig, left(coalesce(p.caption,''), 70) AS t,
           a.modo, a.landing_url
    FROM social_publicaciones p LEFT JOIN social_automatizaciones a USING (media_id)
    ORDER BY p.publicado DESC LIMIT 4`;
  for (const r of rows) console.log(`${r.media_id} ${String(r.publicado).slice(0,10)} ${r.tipo} perfil=${r.en_perfil} coment=${r.conteo_ig} modo=${r.modo ?? "—"}\n   ${r.t.replace(/\n/g," ")}`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
