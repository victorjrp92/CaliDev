import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`SELECT id, codigo, landing, dispositivo, pais, round(max_scroll::numeric,2) s, secciones, paso_formulario, inicio FROM social_visitas ORDER BY inicio DESC LIMIT 10`;
  console.log("visitas:");
  for (const r of rows) console.log(` ${String(r.inicio).slice(4,24)} codigo=${r.codigo ?? "NULL"} ${r.dispositivo} scroll=${r.s} paso=${r.paso_formulario} secciones=${(r.secciones as string[]).length}`);
  const { rows: p } = await sql`SELECT usuario, codigo, media_id FROM social_personas`;
  console.log("códigos de personas:", p.map((x) => `${x.usuario}=${x.codigo}`).join(" "));
  const { rows: m } = await sql`SELECT texto FROM social_mensajes WHERE nuestro = true AND texto LIKE '%asesor%' ORDER BY ts DESC LIMIT 2`;
  console.log("mensajes con tarjeta:", m.length);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
