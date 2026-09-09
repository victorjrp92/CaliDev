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

const recoger = () =>
  pagina.evaluate(() =>
    [...document.querySelectorAll("header a[href], footer a[href], nav a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && !h.startsWith("http") && !h.startsWith("mailto:") && !h.startsWith("tel:"))
  );

// Abrir lo que esconda enlaces antes de contarlos. El selector de idioma pasó a
// ser un desplegable y el recuento cayó de 7 a 5 sin que nada fallara: un
// oráculo que comprueba menos que ayer y sigue en verde es la forma más
// silenciosa de perder cobertura.
//
// Se recoge DESPUÉS DE CADA clic y se acumula, en vez de abrir todo y contar al
// final: hay más de un disparador en la página y abrir el segundo cerraba el
// primero, así que contar al final devolvía exactamente lo mismo que antes.
const href = [...(await recoger())];
for (const disparador of await pagina.locator("[aria-haspopup]").all()) {
  await disparador.click().catch(() => {});
  await pagina.waitForTimeout(250);
  href.push(...(await recoger()));
}

const unicos = [...new Set(href.map((h) => h.split("#")[0]).filter(Boolean))];

let fallos = 0;
for (const h of unicos) {
  const url = new URL(h, BASE).toString();
  // Un intento y un reintento. En desarrollo, la primera petición a una ruta
  // que aún no se ha compilado se agota y devuelve 0; sin el reintento el
  // oráculo denunciaba enlaces rotos que no lo estaban.
  let estado = 0;
  for (let intento = 0; intento < 2 && !(estado >= 200 && estado < 400); intento++) {
    const res = await pagina.request.get(url, { timeout: 60000 }).catch(() => null);
    estado = res?.status() ?? 0;
  }
  const ok = estado >= 200 && estado < 400;
  if (!ok) fallos++;
  console.log(`${ok ? "ok    " : "FALLA "} ${estado}  ${h}`);
}
if (!unicos.length) { console.log("FALLA  no se encontró ni un enlace en barra ni pie — ¿se renderizaron?"); fallos++; }

await navegador.close();
console.log(fallos ? `\n${fallos} enlace(s) rotos` : `\n${unicos.length} enlaces de navegación, todos vivos`);
process.exit(fallos ? 1 : 0);
