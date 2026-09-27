import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`SELECT id, codigo, landing, dispositivo, round(max_scroll::numeric,2) s, secciones, paso_formulario FROM social_visitas WHERE codigo = 'prueba0002'`;
  console.log(rows);
  const { rows: c } = await sql`SELECT selector, seccion, muerto, rabia FROM social_clics WHERE visita_id IN (SELECT id FROM social_visitas WHERE codigo = 'prueba0002')`;
  console.log(c);
  if (process.argv[2] === "borrar") {
    await sql`DELETE FROM social_clics WHERE visita_id IN (SELECT id FROM social_visitas WHERE codigo = 'prueba0002')`;
    await sql`DELETE FROM social_visitas WHERE codigo = 'prueba0002'`;
    console.log("borrado");
  }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
