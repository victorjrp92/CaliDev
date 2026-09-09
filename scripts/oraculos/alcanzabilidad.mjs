/**
 * Ningún titular queda tapado.
 *
 * `innerText` ve el texto aunque esté debajo de la barra fija o detrás de un
 * panel anclado: presencia no es alcanzabilidad. Este oráculo hace scroll de
 * verdad y pregunta al navegador qué elemento hay en el punto donde debería
 * estar cada titular. Si contesta otro, algo lo tapa.
 */
import { chromium } from "playwright";
import { BASE, rutas } from "./rutas.mjs";

const navegador = await chromium.launch();
let fallos = 0;
let mirados = 0;

for (const ruta of rutas(["es"])) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  await pagina.waitForTimeout(800);

  const alto = await pagina.evaluate(() => document.body.scrollHeight);
  const tapados = new Map();

  for (let y = 0; y < alto; y += 450) {
    await pagina.evaluate((y) => window.scrollTo(0, y), y);
    await pagina.waitForTimeout(260);
    const ronda = await pagina.evaluate(() => {
      const fuera = [];
      for (const h of document.querySelectorAll("h1, h2")) {
        const r = h.getBoundingClientRect();
        if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
        // Un punto dentro del titular, hacia el arranque del texto.
        const x = Math.min(r.left + 12, innerWidth - 2);
        const y2 = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 2);
        const enPunto = document.elementFromPoint(x, y2);
        // Solo vale el propio titular o algo suyo (un <span> dentro cuenta).
        // Un ANCESTRO no vale: si el navegador devuelve <body> o un envoltorio,
        // es que el titular no recibe el punto — hay algo encima. Aceptar
        // ancestros dejaba pasar cualquier capa fija, y con eso el oráculo no
        // podía fallar nunca. Se descubrió con el control positivo.
        const visible = enPunto !== null && (enPunto === h || h.contains(enPunto));
        if (!visible) fuera.push((h.textContent || "").trim().slice(0, 40));
      }
      return fuera;
    });
    for (const t of ronda) tapados.set(t, (tapados.get(t) ?? 0) + 1);
    mirados++;
  }

  // Un titular tapado en una sola parada puede ser una animación a medio
  // camino; tapado en todas las paradas en que aparece, es un fallo.
  const persistentes = [...tapados].filter(([, n]) => n >= 2).map(([t]) => t);
  if (persistentes.length) {
    fallos += persistentes.length;
    console.log(`FALLA  ${ruta}  — tapados: ${persistentes.join(" | ")}`);
  } else {
    console.log(`ok     ${ruta}`);
  }
  await pagina.close();
}

await navegador.close();
console.log(fallos ? `\n${fallos} titular(es) tapados` : `\ntodos los titulares alcanzables (${mirados} paradas de scroll)`);
process.exit(fallos ? 1 : 0);
