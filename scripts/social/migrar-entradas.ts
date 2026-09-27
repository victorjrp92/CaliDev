// Crea social_entradas y registra las entradas que ya existían, para no
// reenviar el mensaje a quien ya lo recibió por esa misma publicación.
import { sql } from "../../src/lib/db";
import { asegurarEsquema } from "../../src/lib/social/db";
async function main() {
  await asegurarEsquema();
  const { rowCount } = await sql`
    INSERT INTO social_entradas (igsid, media_id, comment_id, desde)
    SELECT igsid, media_id, comment_id, desde FROM social_personas WHERE media_id IS NOT NULL
    ON CONFLICT (igsid, media_id) DO NOTHING`;
  console.log("entradas registradas:", rowCount);
  const { rows } = await sql`SELECT e.igsid, p.usuario, e.media_id FROM social_entradas e LEFT JOIN social_personas p USING (igsid)`;
  for (const r of rows) console.log(" ", r.usuario, "→", r.media_id);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
