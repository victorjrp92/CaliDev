/**
 * Contraste de la barra MEDIDO EN PANTALLA, no en una lista de pares.
 *
 * `contraste.mjs` comprueba los pares que alguien se acordó de escribir. Este
 * lee los colores que el navegador está pintando de verdad en cada enlace de la
 * barra y los compara con el fondo que tienen detrás, en los dos estados: sin
 * velo y con velo.
 *
 * Existe porque el idioma activo salió en lima sobre hueso —1,5:1, la regla que
 * la propia paleta prohíbe— y la lista de pares no lo vio: el par «lima sobre
 * hueso» no estaba en ella justamente porque se suponía que nunca ocurriría.
 */
import { chromium } from "playwright";
import { BASE, rutas } from "./rutas.mjs";

const MINIMO = 4.5;

const navegador = await chromium.launch();
let fallos = 0;

for (const ruta of rutas(["es"])) {
  for (const [estado, y] of [["sin velo", 0], ["con velo", 700]]) {
    const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
    await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    await pagina.waitForTimeout(700);
    await pagina.evaluate((y) => window.scrollTo(0, y), y);
    await pagina.waitForTimeout(900);

    const medidas = await pagina.evaluate(() => {
      const canal = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const rgb = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
      const mezclar = (frente, detras) => {
        const a = frente[3] ?? 1;
        return [0, 1, 2].map((i) => frente[i] * a + detras[i] * (1 - a));
      };

      const barra = document.querySelector(".barra");
      if (!barra) return null;

      // Fondo real bajo el texto: el de la barra compuesto sobre lo que haya
      // detrás de ella en la página.
      const r = barra.getBoundingClientRect();
      barra.style.pointerEvents = "none";
      const detrasEl = document.elementFromPoint(r.width / 2, r.height + 4);
      barra.style.pointerEvents = "";
      let detras = [250, 250, 247];
      let nodo = detrasEl;
      while (nodo) {
        const c = rgb(getComputedStyle(nodo).backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) >= 0.5) { detras = c; break; }
        nodo = nodo.parentElement;
      }
      const fondo = mezclar(rgb(getComputedStyle(barra).backgroundColor), detras);

      const salida = [];
      for (const el of barra.querySelectorAll("a, span")) {
        const texto = (el.textContent || "").trim();
        if (!texto || el.querySelector("a, span")) continue;
        const e = getComputedStyle(el);
        const op = parseFloat(e.opacity);
        if (op < 0.05) continue;
        // La opacidad del propio elemento acerca su color al fondo.
        const color = mezclar([...rgb(e.color).slice(0, 3), op], fondo);
        const propio = getComputedStyle(el).backgroundColor;
        const c = rgb(propio);
        const suFondo = c.length >= 3 && (c[3] ?? 1) >= 0.5 ? c : fondo;
        const [a, b] = [lum(color), lum(suFondo)].sort((x, y) => y - x);
        salida.push({ texto: texto.slice(0, 22), ratio: +((a + 0.05) / (b + 0.05)).toFixed(2) });
      }
      return salida;
    });

    if (!medidas) {
      console.log(`FALLA  ${ruta} (${estado}) — no se encontró la barra`);
      fallos++;
    } else {
      const malos = medidas.filter((m) => m.ratio < MINIMO);
      if (malos.length) {
        fallos += malos.length;
        for (const m of malos) console.log(`FALLA  ${ruta} (${estado}) — "${m.texto}" a ${m.ratio}:1`);
      } else {
        console.log(`ok     ${ruta} (${estado}) — ${medidas.length} textos, peor ${Math.min(...medidas.map((m) => m.ratio))}:1`);
      }
    }
    await pagina.close();
  }
}

await navegador.close();
console.log(fallos ? `\n${fallos} texto(s) de la barra por debajo de ${MINIMO}:1` : `\ntoda la barra pasa en los dos estados`);
process.exit(fallos ? 1 : 0);
