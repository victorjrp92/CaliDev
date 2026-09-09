/**
 * La barra de navegación no tapa texto grande.
 *
 * Existe porque `alcanzabilidad.mjs` no podía cazar esto, y no por un descuido
 * suyo: las palabras del hero son `<span>` con `pointer-events: none`, así que
 * `document.elementFromPoint` NUNCA las devuelve. Un oráculo de impacto es
 * ciego a todo lo que no recibe el puntero, que es justo la tipografía
 * decorativa — la más grande de la página y la más visible cuando se corta.
 *
 * Este mide geometría: coge el rectángulo de la barra y busca cualquier
 * elemento con texto propio de 20 px o más que se solape con él. Da igual si
 * recibe eventos, si es un pseudo-elemento o si está detrás.
 */
import { chromium } from "playwright";
import { BASE, rutas } from "./rutas.mjs";

/** Tamaño a partir del cual una palabra cortada es evidente. */
const TAM_MINIMO = 20;
/** Solape tolerado, en píxeles. Un par de píxeles es un borde, no un tapado. */
const TOLERANCIA = 3;

const navegador = await chromium.launch();
let fallos = 0;

for (const ruta of rutas(["es"])) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  await pagina.waitForTimeout(900);

  const tapados = await pagina.evaluate(
    ({ TAM_MINIMO, TOLERANCIA }) => {
      const barra = document.querySelector(".barra");
      if (!barra) return { sinBarra: true, lista: [] };
      const b = barra.getBoundingClientRect();

      const lista = [];
      for (const el of document.querySelectorAll("body *")) {
        if (barra.contains(el) || el.contains(barra)) continue;

        // Solo elementos con texto PROPIO: si se contase el de los hijos, cada
        // contenedor de la página aparecería y el informe sería inservible.
        const propio = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .join("");
        if (!propio) continue;

        const estilo = getComputedStyle(el);
        if (estilo.visibility === "hidden" || estilo.display === "none") continue;
        if (parseFloat(estilo.fontSize) < TAM_MINIMO) continue;

        // La opacidad se ACUMULA por la cadena de padres. Mirar solo la del
        // elemento era un punto ciego: la tipografía del hero se desvanece
        // aplicando opacidad al grupo que la contiene, así que cada palabra
        // sigue diciendo `opacity: 1` cuando ya no se ve nada, y el oráculo
        // denunciaba que la barra cortaba una palabra invisible.
        let visible = 1;
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          visible *= parseFloat(getComputedStyle(n).opacity);
          if (visible < 0.05) break;
        }
        if (visible < 0.05) continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        const solape = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        const cruza = Math.min(r.right, b.right) > Math.max(r.left, b.left);
        if (solape > TOLERANCIA && cruza) {
          lista.push({
            texto: propio.slice(0, 34),
            tam: Math.round(parseFloat(estilo.fontSize)),
            solape: Math.round(solape),
          });
        }
      }
      return { sinBarra: false, lista };
    },
    { TAM_MINIMO, TOLERANCIA }
  );

  if (tapados.sinBarra) {
    console.log(`FALLA  ${ruta}  — no se encontró la barra; ¿cambió la clase?`);
    fallos++;
  } else if (tapados.lista.length) {
    fallos += tapados.lista.length;
    for (const t of tapados.lista) {
      console.log(`FALLA  ${ruta}  — la barra corta "${t.texto}" (${t.tam}px) en ${t.solape}px`);
    }
  } else {
    console.log(`ok     ${ruta}`);
  }
  await pagina.close();
}

await navegador.close();
console.log(fallos ? `\n${fallos} texto(s) cortados por la barra` : `\nla barra no corta ningún texto`);
process.exit(fallos ? 1 : 0);
