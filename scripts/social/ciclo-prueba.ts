// Prueba del ciclo en SIMULACIÓN sobre una publicación real (no publica nada).
//   npx tsx --env-file=.env.social.local scripts/social/ciclo-prueba.ts
import { sql } from "../../src/lib/db";
import { asegurarEsquema, ajuste } from "../../src/lib/social/db";
import { guardarAutomatizacion, guardarPublicacion } from "../../src/lib/social/datos";
import { correrCiclo } from "../../src/lib/social/ciclo";
import { TEXTOS_INICIALES } from "../../src/lib/social/textos";

const ID = "18222221302331797";
async function main() {
  await asegurarEsquema();
  console.log("simulacion =", await ajuste("simulacion"));
  await guardarPublicacion({ id: ID, caption: "Trabajo repetitivo", publicado: "2026-09-20T22:23:00Z", tipo: "FEED" });
  await guardarAutomatizacion({ mediaId: ID, modo: "automatico", sensible: false,
    landingUrl: "https://calidev.dev/servinomic/limpiaexpress", palabrasClave: ["ayuda", "info"],
    detectarInteres: true, umbral: 0.7, contexto: null, textos: TEXTOS_INICIALES, activar: true });
  await sql`UPDATE social_automatizaciones SET activado_en = '2026-09-27T00:00:00Z' WHERE media_id = ${ID}`;
  console.log("ciclo 1:", JSON.stringify(await correrCiclo()));
  console.log("ciclo 2:", JSON.stringify(await correrCiclo()));
  const { rows } = await sql`SELECT usuario, texto, tipo, round(confianza::numeric,2) c, accion, estado, respuesta FROM social_comentarios WHERE media_id = ${ID}`;
  for (const r of rows) console.log(" ", r);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
