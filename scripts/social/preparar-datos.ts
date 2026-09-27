// Esquema al día + publicaciones (con en_perfil) + una medición de métricas + copia de la bandeja.
import { asegurarEsquema } from "../../src/lib/social/db";
import { fijarConteoIg, guardarPublicacion } from "../../src/lib/social/datos";
import { publicaciones } from "../../src/lib/social/instagram";
import { medirPublicaciones } from "../../src/lib/social/metricas";
import { sincronizarBandeja } from "../../src/lib/social/sincronizar-chats";
async function main() {
  await asegurarEsquema(); console.log("esquema ok");
  const ps = await publicaciones(50);
  for (const p of ps) {
    await guardarPublicacion({ id: p.id, caption: p.caption, permalink: p.permalink, publicado: p.timestamp,
      miniatura: p.thumbnail_url ?? p.media_url, tipo: p.media_product_type ?? p.media_type,
      enPerfil: p.media_product_type === "REELS" ? p.is_shared_to_feed !== false : true });
    await fijarConteoIg(p.id, p.comments_count ?? 0);
  }
  console.log("publicaciones:", ps.length, "| sin perfil:", ps.filter((p) => p.is_shared_to_feed === false).length);
  console.log("métricas:", JSON.stringify(await medirPublicaciones()));
  console.log("bandeja:", JSON.stringify(await sincronizarBandeja(true, 10)));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
