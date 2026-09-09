/**
 * Ningún titular queda tapado.
 *
 * `innerText` ve el texto aunque esté debajo de la barra fija o detrás de un
 * panel anclado: presencia no es alcanzabilidad. Este oráculo hace scroll de
 * verdad y pregunta al navegador qué elemento hay en el punto donde debería
 * estar cada titular. Si contesta otro, algo lo tapa.
 *
 * El cuerpo de la comprobación vive en `titulares-tapados.mjs`, compartido con
 * su control positivo para que no puedan separarse.
 */
import { chromium } from "playwright";
import { BASE, rutas } from "./rutas.mjs";
import { recorrer } from "./titulares-tapados.mjs";

const navegador = await chromium.launch();
let fallos = 0;
let paradas = 0;

for (const ruta of rutas(["es"])) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  await pagina.waitForTimeout(800);

  const { persistentes, paradas: n } = await recorrer(pagina);
  paradas += n;

  if (persistentes.length) {
    fallos += persistentes.length;
    console.log(`FALLA  ${ruta}  — tapados: ${persistentes.join(" | ")}`);
  } else {
    console.log(`ok     ${ruta}`);
  }
  await pagina.close();
}

await navegador.close();
console.log(fallos ? `\n${fallos} titular(es) tapados` : `\ntodos los titulares alcanzables (${paradas} paradas de scroll)`);
process.exit(fallos ? 1 : 0);
