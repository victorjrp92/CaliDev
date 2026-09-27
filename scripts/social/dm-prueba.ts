// Prueba del ciclo de mensajes en SIMULACIÓN con una persona temporal.
import { sql } from "../../src/lib/db";
import { correrCiclo } from "../../src/lib/social/ciclo";
const IG = "1010871755112354";
async function main() {
  await sql`INSERT INTO social_personas (igsid, usuario, codigo, media_id, comment_id, paso, desde)
    VALUES (${IG}, 'victorjrp9', 'prueba0001', '18222221302331797', '17971120011153642', 'esperando_boton', '2026-09-27T13:20:30Z')
    ON CONFLICT (igsid) DO UPDATE SET paso = 'esperando_boton', desde = '2026-09-27T13:20:30Z'`;
  console.log("ciclo:", JSON.stringify(((await correrCiclo()) as { mensajes?: unknown }).mensajes));
  const { rows } = await sql`SELECT ts, nuestro, texto, accion, estado FROM social_mensajes WHERE igsid = ${IG} ORDER BY ts`;
  for (const r of rows) console.log(" ", r.ts.toISOString().slice(11, 19), r.nuestro ? "nosotros" : "persona ", JSON.stringify(r.texto)?.slice(0, 50), r.accion, r.estado);
  await sql`DELETE FROM social_mensajes WHERE igsid = ${IG}`;
  await sql`DELETE FROM social_personas WHERE igsid = ${IG}`;
  console.log("limpio");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
