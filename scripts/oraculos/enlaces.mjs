/**
 * Ningún enlace de la barra o del pie lleva a un 404.
 *
 * Es el fallo que más fácil se cuela: una clave de traducción para «Política de
 * privacidad» existe desde hace meses y la ruta nunca se creó.
 */
import { chromium } from "playwright";
import { BASE } from "./rutas.mjs";

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
await pagina.goto(BASE + "/es", { waitUntil: "networkidle", timeout: 45000 });

const href = await pagina.evaluate(() =>
  [...document.querySelectorAll("header a[href], footer a[href], nav a[href]")]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && !h.startsWith("http") && !h.startsWith("mailto:") && !h.startsWith("tel:"))
);
const unicos = [...new Set(href.map((h) => h.split("#")[0]).filter(Boolean))];

let fallos = 0;
for (const h of unicos) {
  const url = new URL(h, BASE).toString();
  const res = await pagina.request.get(url).catch(() => null);
  const estado = res?.status() ?? 0;
  const ok = estado >= 200 && estado < 400;
  if (!ok) fallos++;
  console.log(`${ok ? "ok    " : "FALLA "} ${estado}  ${h}`);
}
if (!unicos.length) { console.log("FALLA  no se encontró ni un enlace en barra ni pie — ¿se renderizaron?"); fallos++; }

await navegador.close();
console.log(fallos ? `\n${fallos} enlace(s) rotos` : `\n${unicos.length} enlaces de navegación, todos vivos`);
process.exit(fallos ? 1 : 0);
