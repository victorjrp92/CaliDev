/**
 * `/#servicios` cae donde debe.
 *
 * La sección de servicios está anclada con ScrollTrigger y cambia el alto total
 * de la página *después* de que el navegador haya hecho el salto por hash. Sin
 * corrección, el salto nativo aterriza en el sitio equivocado — y es justo el
 * atajo que se pidió: entrar a servicios sin pasar por el hero.
 */
import { chromium } from "playwright";
import { BASE } from "./rutas.mjs";

const CASOS = [
  { ruta: "/es#servicios", ancla: "#servicios" },
  { ruta: "/es#testimonios", ancla: "#testimonios" },
  { ruta: "/es#herramientas", ancla: "#herramientas" },
];
const MARGEN = 100;

const navegador = await chromium.launch();
let fallos = 0;

for (const { ruta, ancla } of CASOS) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  await pagina.waitForTimeout(1800); // que ScrollTrigger mida y corrija

  const existe = await pagina.locator(ancla).count();
  if (!existe) {
    console.log(`FALLA  ${ruta}  — no existe ${ancla} en la página`);
    fallos++;
    await pagina.close();
    continue;
  }
  const top = await pagina.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, ancla);
  const ok = Math.abs(top) <= MARGEN;
  if (!ok) fallos++;
  console.log(`${ok ? "ok    " : "FALLA "} ${ruta}  — borde superior a ${Math.round(top)}px (margen ±${MARGEN})`);
  await pagina.close();
}

await navegador.close();
console.log(fallos ? `\n${fallos} ancla(s) mal` : `\ntodas las anclas caen en su sitio`);
process.exit(fallos ? 1 : 0);
