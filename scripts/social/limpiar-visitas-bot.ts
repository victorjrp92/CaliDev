// Borra las visitas que dejaron los oráculos de Playwright (sin código, sin
// formulario) durante las pruebas de hoy, para que el mapa muestre solo gente.
import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`SELECT id FROM social_visitas WHERE codigo IS NULL AND paso_formulario = 0 AND inicio > NOW() - INTERVAL '1 day'`;
  const ids = rows.map((r) => r.id as string);
  console.log("visitas de prueba a borrar:", ids.length);
  for (const id of ids) {
    await sql`DELETE FROM social_clics WHERE visita_id = ${id}`;
    await sql`DELETE FROM social_visitas WHERE id = ${id}`;
  }
  const { rows: q } = await sql`SELECT COUNT(*) n, COUNT(codigo) c FROM social_visitas`;
  console.log("quedan:", q[0].n, "visitas ·", q[0].c, "con código de Instagram");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
