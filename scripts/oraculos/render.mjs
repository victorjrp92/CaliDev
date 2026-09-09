/**
 * Cada ruta responde 200, tiene un h1 con texto y no suelta errores en consola.
 *
 * El build no caza un identificador sin definir dentro de un componente cliente
 * ni una clave de traducción que no existe: hay que pintar la pantalla.
 */
import { chromium } from "playwright";
import { BASE, rutas } from "./rutas.mjs";

const navegador = await chromium.launch();
let fallos = 0;

for (const ruta of rutas()) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(String(e).slice(0, 120)));
  pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 120)); });

  const res = await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  const estado = res?.status() ?? 0;
  const h1 = await pagina.locator("h1").first().textContent().catch(() => null);
  const problemas = [];
  if (estado !== 200) problemas.push(`estado ${estado}`);
  if (!h1?.trim()) problemas.push("h1 vacío o ausente");
  if (errores.length) problemas.push(`consola: ${errores[0]}`);

  if (problemas.length) { fallos++; console.log(`FALLA  ${ruta}  — ${problemas.join(" · ")}`); }
  else console.log(`ok     ${ruta}  — "${h1.trim().slice(0, 46)}"`);
  await pagina.close();
}

await navegador.close();
console.log(fallos ? `\n${fallos} ruta(s) con problemas` : `\ntodas las rutas responden y tienen titular`);
process.exit(fallos ? 1 : 0);
