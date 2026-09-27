// Regresión de Jev: 48 comentarios de verdad conocida. Falla (código 1) si hay
// menos de 46 aciertos o si algún error pasaría por encima del umbral.
//   npx tsx --env-file=.env.social.local scripts/social/regresion-jev.ts
import { readFileSync } from "node:fs";
import { clasificarComentario } from "../../src/lib/social/jev";

const UMBRAL = 0.7;
const casos: { tipo: string; texto: string }[] = JSON.parse(
  readFileSync(new URL("./comentarios-verdad.json", import.meta.url), "utf8"),
);

async function main() {
  const res: { tipo: string; texto: string; jev: string; conf: number }[] = [];
  for (let i = 0; i < casos.length; i += 6) {
    const lote = await Promise.all(casos.slice(i, i + 6).map(async (c) => {
      const j = await clasificarComentario(c.texto, null);
      return { ...c, jev: j.tipo, conf: j.confianza };
    }));
    res.push(...lote);
  }
  const aciertos = res.filter((r) => r.jev === r.tipo).length;
  const automaticos = res.filter((r) => r.jev !== r.tipo && r.conf >= UMBRAL);
  for (const r of res.filter((r) => r.jev !== r.tipo || r.conf < UMBRAL)) {
    console.log(`  ${r.tipo} → ${r.jev} ${r.conf.toFixed(2)} «${r.texto}»`);
  }
  console.log(`${aciertos}/${res.length} · errores automáticos ${automaticos.length}`);
  return aciertos >= 46 && automaticos.length === 0;
}
main().then((ok) => process.exit(ok ? 0 : 1), (e) => { console.error(e); process.exit(1); });
