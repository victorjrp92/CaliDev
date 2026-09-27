import { sql } from "../../src/lib/db";
import { comentarios, publicaciones } from "../../src/lib/social/instagram";
const ID = "18222221302331797";
async function main() {
  const { rows: a } = await sql`SELECT clave, valor FROM social_ajustes WHERE clave IN ('simulacion','pausado','ultimo_ciclo','candado')`;
  console.log("ajustes:", a.map((r) => `${r.clave}=${r.valor}`).join(" "));
  const { rows: au } = await sql`SELECT modo, activado_en, proxima_revision, umbral FROM social_automatizaciones WHERE media_id = ${ID}`;
  console.log("automatización:", au[0]);
  const { rows: p } = await sql`SELECT comentarios_vistos, conteo_ig FROM social_publicaciones WHERE media_id = ${ID}`;
  console.log("conteos guardados:", p[0]);
  const ps = await publicaciones(50);
  console.log("conteo que dice Instagram AHORA:", ps.find((x) => x.id === ID)?.comments_count);
  console.log("--- comentarios en Instagram:");
  for (const c of await comentarios(ID)) console.log(`  ${c.timestamp} @${c.from?.username ?? c.username} ${c.parent_id ? "(respuesta)" : ""} «${c.text}»`);
  const { rows: g } = await sql`SELECT id, usuario, texto, tipo, confianza, accion, estado, error, ts FROM social_comentarios WHERE media_id = ${ID} ORDER BY ts`;
  console.log("--- en la base:"); for (const r of g) console.log(" ", r);
  const { rows: e } = await sql`SELECT ts, nivel, texto FROM social_eventos ORDER BY ts DESC LIMIT 6`;
  console.log("--- eventos:"); for (const r of e) console.log(" ", new Date(r.ts).toISOString().slice(11,19), r.nivel, r.texto.slice(0,110));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
