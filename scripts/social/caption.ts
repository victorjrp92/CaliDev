import { sql } from "../../src/lib/db";
async function main() {
  const { rows } = await sql`SELECT caption, permalink FROM social_publicaciones WHERE media_id = '18222221302331797'`;
  console.log(rows[0].permalink); console.log("---"); console.log(rows[0].caption);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
