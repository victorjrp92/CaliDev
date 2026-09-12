/**
 * La página funciona en un teléfono.
 *
 * Este oráculo existe porque faltaba. Los otros ocho miden todos a 1440×900, y
 * con los ocho en verde la página estuvo rota en móvil: los cuatro paneles de
 * servicio vivían en una tira horizontal de 2340 px que había que deslizar, así
 * que bajando —que es lo que hace todo el mundo— se pasaba del panel de entrada
 * a los testimonios sin ver un solo servicio. El vídeo del hero, además, se
 * expandía a pantalla completa: un archivo de 1152×642 metido en una caja de
 * 390×664 deja ver el 33 % del ancho, y lo que se veía era una espalda.
 *
 * Nada de eso lo podía cazar una comprobación a 1440 px. De ahí las cuatro
 * medidas de abajo, todas sobre lo que se pinta de verdad.
 *
 * Control positivo en `control-movil.mjs`: devuelve la maqueta vieja por CSS y
 * comprueba que este oráculo la suspende.
 */
import { chromium, devices } from "playwright";
import { BASE } from "./rutas.mjs";

const TELEFONOS = ["iPhone 13", "iPhone SE", "Pixel 7", "Galaxy S9+"];
const IDIOMAS = ["es", "en", "de"];

/** Mínimo del ancho del vídeo que tiene que verse. Por debajo, la escena no se lee. */
const VISIBLE_MINIMO = 95;
/** Paneles de la sección de servicios: entrada + cuatro + cierre. */
const PANELES = 6;

/** Dos cajas chocan solo si se pisan en los dos ejes. */
const SOLAPA = `(a, b) => {
  const r = (e) => e.getBoundingClientRect();
  return r(a).top < r(b).bottom && r(a).bottom > r(b).top &&
         r(a).left < r(b).right && r(a).right > r(b).left;
}`;

export async function medir(pagina, { forzarViejo = false } = {}) {
  if (forzarViejo) {
    // La tira horizontal de antes, para el control positivo.
    await pagina.addStyleTag({
      content: `#servicios > div { flex-direction: row !important; overflow-x: auto !important; }
                #servicios > div > * { width: 100vw !important; flex: none !important; }`,
    });
    await pagina.waitForTimeout(600);
  }

  const hero = await pagina.evaluate((src) => {
    const solapa = eval(src);
    const pildora = document.querySelector(".hero-pill");
    if (!pildora) return null;
    const seccion = pildora.closest("section");
    const cta = document.querySelector('a[href="#servicios"]');
    const tu = document.querySelector(".hero-tu");
    const palabras = [...document.querySelectorAll("h1 span")];
    const ventaja = palabras[palabras.length - 1];
    const video = document.querySelector("video");
    const r = (e) => e.getBoundingClientRect();

    const relCaja = r(pildora).width / r(pildora).height;
    const relVideo = video && video.videoWidth ? video.videoWidth / video.videoHeight : null;

    return {
      // El hero tiene que empezar donde empieza la página. Si el anclaje se
      // registra dos veces, el espaciador se descuadra y arranca más abajo.
      arranca: Math.round(r(seccion).top),
      choques: [
        cta && solapa(cta, pildora) && "el botón sobre el vídeo",
        tu && solapa(tu, pildora) && "«tu» sobre el vídeo",
        tu && ventaja && solapa(tu, ventaja) && "«tu» sobre «ventaja»",
      ].filter(Boolean),
      ventajaCabe: ventaja ? Math.round(r(ventaja).bottom) <= window.innerHeight + 1 : true,
      visible: relVideo ? Math.round(Math.min(1, relCaja / relVideo) * 100) : 100,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, SOLAPA);

  // Titulares de servicios que se alcanzan bajando, sin deslizar a los lados.
  const alto = await pagina.evaluate(() => document.body.scrollHeight);
  const vh = await pagina.evaluate(() => window.innerHeight);
  const vistos = new Set();
  for (let y = 0; y <= alto; y += Math.round(vh / 3)) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(100);
    const encontrados = await pagina.evaluate(() => {
      const salida = [];
      for (const t of document.querySelectorAll("#servicios h3, #servicios h2")) {
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight || !r.width) continue;
        // Alcanzable = pintado ahí, no solo presente en el DOM.
        const x = Math.min(window.innerWidth - 2, r.left + Math.min(r.width, 60) / 2);
        const yy = Math.min(window.innerHeight - 2, Math.max(2, r.top + r.height / 2));
        const enPunto = document.elementFromPoint(x, yy);
        if (enPunto === t || t.contains(enPunto) || enPunto?.contains(t)) {
          salida.push(t.textContent.trim().slice(0, 34));
        }
      }
      return salida;
    });
    encontrados.forEach((e) => vistos.add(e));
  }

  return { ...hero, servicios: vistos.size };
}

export function juzgar(m) {
  if (!m) return ["no se encontró el hero"];
  const motivos = [];
  if (m.arranca !== 0) motivos.push(`el hero arranca a ${m.arranca}px, no a 0`);
  if (m.desborde > 0) motivos.push(`${m.desborde}px de desborde horizontal`);
  if (m.visible < VISIBLE_MINIMO) motivos.push(`solo se ve el ${m.visible}% del ancho del vídeo`);
  if (m.servicios < PANELES) motivos.push(`solo ${m.servicios} de ${PANELES} paneles alcanzables bajando`);
  if (!m.ventajaCabe) motivos.push("«ventaja» se sale de la pantalla");
  motivos.push(...m.choques);
  return motivos;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const navegador = await chromium.launch();
  let fallos = 0;

  for (const telefono of TELEFONOS) {
    for (const idioma of IDIOMAS) {
      const contexto = await navegador.newContext({ ...devices[telefono] });
      const pagina = await contexto.newPage();
      await pagina
        .goto(`${BASE}/${idioma}`, { waitUntil: "networkidle", timeout: 45000 })
        .catch(() => null);
      await pagina.waitForTimeout(2400);

      const medida = await medir(pagina);
      const motivos = juzgar(medida);
      if (motivos.length) fallos++;
      console.log(
        `${motivos.length ? "FALLA " : "ok    "} ${telefono.padEnd(12)} ${idioma}  — ` +
          (motivos.length
            ? motivos.join("; ")
            : `${medida.servicios}/${PANELES} paneles, ${medida.visible}% del vídeo, sin desborde`)
      );
      await contexto.close();
    }
  }

  await navegador.close();
  console.log(fallos ? `\n${fallos} combinación(es) rotas en móvil` : `\nla página se usa en un teléfono`);
  process.exit(fallos ? 1 : 0);
}
