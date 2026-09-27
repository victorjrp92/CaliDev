import { proxy } from "../../src/lib/social/composio";
import { sql } from "../../src/lib/db";
const COMENTARIO = "17946764328316743";
async function main() {
  const r = await proxy("GET", `https://graph.instagram.com/v21.0/${COMENTARIO}`, undefined,
    { fields: "id,text,username,timestamp,replies{id,text,username,timestamp}" });
  console.log("comentario de ella:", r.text, "| @" + r.username);
  for (const x of r.replies?.data ?? []) console.log("  respuesta @" + x.username, "->", x.text);
  const { rows } = await sql`SELECT igsid FROM social_personas WHERE usuario = 'ni_da_34'`;
  const igsid = rows[0]?.igsid;
  const { rows: c } = await sql`SELECT conversation_id FROM social_conversaciones WHERE igsid = ${igsid}`;
  const m = await proxy("GET", `https://graph.instagram.com/v21.0/${c[0].conversation_id}/messages`, undefined,
    { fields: "id,from,message,created_time", limit: "10" });
  console.log("--- mensajes directos con ella (según Instagram):");
  for (const x of (m.data ?? []).reverse()) console.log(` ${x.created_time} @${x.from?.username}: ${JSON.stringify(x.message)}`);
}
main().then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1); });
