/**
 * Control positivo de `alcanzabilidad.mjs`.
 *
 * Inyecta una barra fija real y comprueba que el oráculo la caza. Existe porque
 * la primera versión del oráculo NO la cazaba: aceptaba como visible cualquier
 * ancestro devuelto por `elementFromPoint`, y una capa fija hace que devuelva
 * `<body>`, que es ancestro de todo. Pasaba siempre.
 *
 * Correr después de tocar el oráculo:
 *   node scripts/oraculos/control-alcanzabilidad.mjs 300   → debe salir 1
 *   node scripts/oraculos/control-alcanzabilidad.mjs 2     → debe salir 0
 */
import { chromium } from "playwright";

const ALTO = Number(process.argv[2] ?? 300);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/es/about", { waitUntil: "networkidle", timeout: 45000 });
await p.evaluate((h) => {
  const d = document.createElement("div");
  d.style.cssText = `position:fixed;top:0;left:0;right:0;height:${h}px;background:#0a3d2e;z-index:99999`;
  document.body.appendChild(d);
}, ALTO);
await p.waitForTimeout(400);

const alto = await p.evaluate(() => document.body.scrollHeight);
const tapados = new Map();
for (let y = 0; y < alto; y += 450) {
  await p.evaluate((y) => window.scrollTo(0, y), y);
  await p.waitForTimeout(200);
  const ronda = await p.evaluate(() => {
    const fuera = [];
    for (const h of document.querySelectorAll("h1, h2")) {
      const r = h.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      const x = Math.min(r.left + 12, innerWidth - 2);
      const y2 = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 2);
      const e = document.elementFromPoint(x, y2);
      if (!(e !== null && (e === h || h.contains(e)))) fuera.push((h.textContent || "").trim().slice(0, 40));
    }
    return fuera;
  });
  for (const t of ronda) tapados.set(t, (tapados.get(t) ?? 0) + 1);
}

const persistentes = [...tapados].filter(([, n]) => n >= 2).map(([t]) => t);
await b.close();
console.log(persistentes.length ? `CAZADOS ${persistentes.length}: ${persistentes.slice(0, 2).join(" | ")}` : "no cazó nada");
process.exit(persistentes.length ? 1 : 0);
