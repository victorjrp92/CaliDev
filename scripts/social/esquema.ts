// Crea o verifica las tablas social_* contra la base real. Uso:
//   npx tsx --env-file=.env.social.local scripts/social/esquema.ts
import { asegurarEsquema } from "../../src/lib/social/db";
import { sql } from "../../src/lib/db";

async function main() {
  await asegurarEsquema();
  const { rows } = await sql`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'social\_%' ORDER BY 1`;
  console.log(rows.length, "tablas:", rows.map((r) => r.table_name).join(", "));
  const { rows: c } = await sql`SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='social_codigo'`;
  console.log("leads.social_codigo:", c.length === 1);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
