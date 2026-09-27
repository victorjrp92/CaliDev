// Humo de lectura contra servicios reales (no publica nada). Uso:
//   npx tsx --env-file=.env.social.local scripts/social/humo.ts
import { herramienta, proxy } from "../../src/lib/social/composio";
import { publicaciones, comentarios } from "../../src/lib/social/instagram";
import { clasificarComentario } from "../../src/lib/social/jev";
import { redactar } from "../../src/lib/social/redactor";

async function main() {
  const yo = await herramienta("INSTAGRAM_GET_USER_INFO", { ig_user_id: "me", fields: "username" });
  console.log("cuenta:", yo.username);
  const me = await proxy("GET", "https://graph.instagram.com/v21.0/me", undefined, { fields: "username" });
  console.log("proxy:", me.username);
  const ps = await publicaciones(5);
  console.log("publicaciones:", ps.length, ps.map((p) => `${p.id}:${p.comments_count}`).join(" "));
  const cs = await comentarios("18222221302331797");
  console.log("comentarios del 20 sep:", cs.map((c) => `${c.from?.username}:${c.text}`).join(" | "));
  const j = await clasificarComentario("Ayuda", null);
  console.log("jev:", j.tipo, j.confianza.toFixed(2));
  console.log("deepseek:", await redactar("¡Qué orgullo Deisy! 👏", "agradecer con calidez la felicitación"));
}
main().then(() => process.exit(0), (e) => { console.error("FALLO:", e.message); process.exit(1); });
