import { listaLandings, mapaLanding } from "../../src/lib/social/consultas";
async function main() {
  console.log("lista:", await listaLandings());
  const m = await mapaLanding("/servinomic/limpiaexpress", null);
  console.log("mapa sin publicación → visitas:", m.total, "· desde Instagram:", m.desdeEsta);
  const c = await mapaLanding("/servinomic/limpiaexpress", "18222221302331797");
  console.log("mapa de la publicación → visitas:", c.total, "· de esa publicación:", c.desdeEsta);
  console.log("secciones:", m.secciones.filter((s) => s.pct > 0));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
