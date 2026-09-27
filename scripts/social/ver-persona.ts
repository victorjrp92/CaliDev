import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`SELECT igsid, usuario, codigo, paso, rama, desde, ultimo_mensaje_de_ella FROM social_personas ORDER BY desde DESC LIMIT 5`;
  console.log("personas en el flujo:"); for (const r of rows) console.log(" ", r);
  const { rows: m } = await sql`SELECT id, igsid, texto, nuestro, ts, origen, accion, estado FROM social_mensajes ORDER BY ts DESC LIMIT 8`;
  console.log("mensajes recientes:"); for (const r of m) console.log(" ", String(r.ts).slice(11,19), r.nuestro ? "nosotros" : "ella", `[${r.origen}]`, JSON.stringify(r.texto)?.slice(0,80), r.accion ?? "", r.estado ?? "");
  const { rows: c } = await sql`SELECT igsid, usuario, actualizado_ig FROM social_conversaciones ORDER BY actualizado_ig DESC LIMIT 4`;
  console.log("bandeja (copia local):"); for (const r of c) console.log(" ", r.usuario, String(r.actualizado_ig).slice(0,19));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
