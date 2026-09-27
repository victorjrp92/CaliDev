// Estado del agente: último ciclo, ajustes y eventos recientes.
import { sql } from "../../src/lib/db";
async function main() {
  const { rows: a } = await sql`SELECT clave, valor FROM social_ajustes ORDER BY clave`;
  for (const r of a) if (r.clave !== "candado") console.log(` ${r.clave} = ${r.valor}`);
  const { rows: e } = await sql`SELECT ts, nivel, texto FROM social_eventos ORDER BY ts DESC LIMIT 5`;
  console.log("eventos:", e.length ? "" : "ninguno");
  for (const r of e) console.log(" ", new Date(r.ts).toISOString().slice(11, 19), r.nivel, r.texto.slice(0, 90));
}
main().then(() => process.exit(0), (x) => { console.error(x); process.exit(1); });
