// Prueba del análisis con Gemini a partir de un archivo local (lectura).
//   npx tsx --env-file=.env.social.local scripts/social/video-prueba.ts ruta.mp4
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { analizarVideo } from "../../src/lib/social/gemini";
async function main() {
  const bytes = readFileSync(process.argv[2]);
  // Servir el archivo por HTTP local para usar el mismo camino que en producción (descargar una URL).
  const srv = createServer((_, res) => { res.writeHead(200, { "Content-Type": "video/mp4" }); res.end(bytes); }).listen(0);
  const puerto = (srv.address() as { port: number }).port;
  const t = Date.now();
  const a = await analizarVideo(`http://127.0.0.1:${puerto}/v.mp4`);
  srv.close();
  console.log("segundos:", ((Date.now() - t) / 1000).toFixed(1), "| duración:", a.duracion_s, "| escenas:", a.escenas.length);
  console.log("transcripción:", a.transcripcion.slice(0, 3).map((x) => `${x.t0}-${x.t1}: ${x.texto}`).join(" / "));
  console.log("gancho:", JSON.stringify(a.gancho.retencion), JSON.stringify(a.gancho.moneda_social));
  console.log("fallos:", a.gancho.fallos.join(" | "));
  console.log("recomendación:", a.recomendacion);
}
main().then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1); });
