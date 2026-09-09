/**
 * Captura el sitio real con distintas combinaciones tipográficas.
 *
 * No dibuja texto encima de una foto: carga las fuentes en la página viva,
 * sustituye las tres fichas de familia y fotografía las secciones. Lo que se ve
 * es exactamente lo que se tendría, con los mismos saltos de línea y los mismos
 * desbordes si los hay — que es justo donde una tipografía se cae y una maqueta
 * dibujada nunca lo enseña.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SALIDA = "/tmp/tipos";
mkdirSync(SALIDA, { recursive: true });

/**
 * Las caras locales de la carpeta de Victor, ya recortadas a latino y
 * convertidas a woff2, incrustadas como data URI. Van todas en cada página
 * porque cargarlas cuesta nada y evita un montaje distinto por combinación.
 */
const CARAS_LOCALES = readFileSync(
  "/private/tmp/claude-501/-Users-victorjrp92/c18727fc-5b37-4311-a62d-25da02d62e4c/scratchpad/caras.css",
  "utf8"
);

const COMBOS = [
  {
    id: "actual",
    titular: "Archivo",
    pesoTitular: 800,
    cuerpo: "Archivo",
    mono: "IBM Plex Mono",
    cursiva: "Instrument Serif",
    google: "Archivo:wght@400;500;600;800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1",
  },
  {
    // Losa: la slab de Arvo manda y la sans de cabina de B612 sostiene el texto.
    id: "losa",
    titular: "Arvo",
    pesoTitular: 700,
    cuerpo: "B612",
    mono: "IBM Plex Mono",
    cursiva: "Vollkorn",
    google: "IBM+Plex+Mono:wght@400;500",
  },
  {
    // Lectura: titular de serif cálida, cuerpo técnico.
    id: "lectura",
    titular: "Vollkorn",
    pesoTitular: 800,
    cuerpo: "B612",
    mono: "IBM Plex Mono",
    cursiva: "Vollkorn",
    google: "IBM+Plex+Mono:wght@400;500",
  },
  {
    // Invertida: lo contrario, y sin una sola fuente de Google — las etiquetas
    // también salen de la carpeta, en B612 espaciada.
    id: "invertida",
    titular: "B612",
    pesoTitular: 700,
    cuerpo: "Vollkorn",
    mono: "B612",
    cursiva: "Vollkorn",
    google: null,
  },
];

/** Cada toma: dónde ir, qué recortar y cuánto esperar a que se asiente. */
const TOMAS = [
  { id: "hero", url: "/es", y: 0, alto: 720, espera: 1800 },
  { id: "servicios", url: "/es#servicios", y: null, alto: 720, espera: 2600 },
  { id: "testimonios", url: "/es#testimonios", y: null, alto: 720, espera: 2400 },
  { id: "cierre", url: "/es#contacto", y: null, alto: 560, espera: 2400 },
];

const navegador = await chromium.launch();

for (const combo of COMBOS) {
  for (const toma of TOMAS) {
    const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await pagina.goto(BASE + toma.url, { waitUntil: "networkidle", timeout: 90000 });

    await pagina.addStyleTag({ content: CARAS_LOCALES });
    if (combo.google) {
      await pagina.addStyleTag({
        url: `https://fonts.googleapis.com/css2?family=${combo.google}&display=block`,
      });
    }

    // Las tres fichas mandan sobre todo el sitio; los titulares se separan
    // aparte porque hoy comparten familia con el cuerpo y estas propuestas no.
    await pagina.addStyleTag({
      content: `
        .senal {
          --font-archivo: "${combo.cuerpo}";
          --font-plex: "${combo.mono}";
          --font-instrument: "${combo.cursiva}";
        }
        h1, h2, h3, blockquote {
          font-family: "${combo.titular}", Georgia, serif !important;
          font-weight: ${combo.pesoTitular} !important;
        }
        /* Las palabras del hero llevan la familia en un atributo style, así que
           la herencia del h1 no las alcanza: sin esto el titular más grande del
           sitio salía con la fuente de cuerpo. Las dos primeras son las de
           palo; la tercera es la cursiva y ya toma --font-instrument. */
        h1 > div:nth-of-type(1) span,
        h1 > div:nth-of-type(2) span {
          font-family: "${combo.titular}", Georgia, serif !important;
          font-weight: ${combo.pesoTitular} !important;
        }
        .serif, .senal .serif {
          font-family: "${combo.cursiva}", Georgia, serif !important;
        }
        nextjs-portal { display: none !important; }
      `,
    });

    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(toma.espera);
    if (toma.y !== null) await pagina.evaluate((y) => window.scrollTo(0, y), toma.y);
    await pagina.waitForTimeout(500);

    await pagina.screenshot({
      path: `${SALIDA}/${combo.id}-${toma.id}.png`,
      clip: { x: 0, y: 0, width: 1440, height: toma.alto },
    });

    // Prueba de que la fuente se aplicó de verdad: mirar la captura no basta,
    // dos grotescas se parecen lo suficiente como para dar por bueno un fallo.
    const aplicado = await pagina.evaluate(() => {
      const fam = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).fontFamily.split(",")[0].replace(/"/g, "") : "—";
      };
      return {
        titular: fam("h1 > div:nth-of-type(1) span") !== "—" ? fam("h1 > div:nth-of-type(1) span") : fam("h2"),
        cuerpo: fam("p:not(.mono)"),
        mono: fam(".mono"),
      };
    });
    console.log(`${combo.id} · ${toma.id} → titular ${aplicado.titular} · cuerpo ${aplicado.cuerpo} · mono ${aplicado.mono}`);
    await pagina.close();
  }
}

await navegador.close();
console.log("listo");
