/**
 * Control positivo de `alcanzabilidad.mjs`.
 *
 * Inyecta una barra fija real y comprueba que el oráculo la caza. Existe porque
 * la primera versión NO la cazaba: aceptaba como visible cualquier ancestro
 * devuelto por `elementFromPoint`, y una capa fija hace que devuelva `<body>`,
 * que es ancestro de todo. Pasaba siempre.
 *
 * Usa `recorrer` del módulo compartido, no una copia: antes tenía la suya y así
 * demostraba que funcionaba la copia, que es cómo un verificador acaba ciego
 * sin que nadie se entere.
 *
 * Tres medidas, y las tres dicen algo distinto:
 *
 *   900 → sale 1. Una capa que cubre la pantalla entera no deja leer nada.
 *   300 → sale 1, y es correcto: caza el `h1` del arranque de la página, que
 *         bajo una barra tan alta queda ilegible para siempre porque no hay
 *         hacia dónde subir. Es la clase de fallo que motivó todo esto.
 *     2 → sale 0. Sin nada que tape, no hay nada que denunciar.
 *
 * Lo que este oráculo NO denuncia es el tapado pasajero: un titular que la
 * barra cubre un momento y se libera bajando un poco más se lee perfectamente,
 * y marcarlo sería ruido.
 */
import { chromium } from "playwright";
import { BASE } from "./rutas.mjs";
import { recorrer } from "./titulares-tapados.mjs";

const ALTO = Number(process.argv[2] ?? 900);
const RUTA = process.argv[3] ?? "/es/about";

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
await pagina.goto(BASE + RUTA, { waitUntil: "networkidle", timeout: 45000 });
await pagina.evaluate((h) => {
  const d = document.createElement("div");
  d.style.cssText = `position:fixed;top:0;left:0;right:0;height:${h}px;background:#0a3d2e;z-index:99999`;
  document.body.appendChild(d);
}, ALTO);
await pagina.waitForTimeout(400);

const { persistentes } = await recorrer(pagina);
await navegador.close();

console.log(
  persistentes.length
    ? `CAZADOS ${persistentes.length}: ${persistentes.slice(0, 2).join(" | ")}`
    : "no cazó nada"
);
process.exit(persistentes.length ? 1 : 0);
