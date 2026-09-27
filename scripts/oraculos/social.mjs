// Oráculo de calidev.dev/social. Uso:
//   BASE=http://localhost:3000 PANEL_SOCIAL_PASSWORD=… [VERCEL_BYPASS=…] node scripts/oraculos/social.mjs
// Comprueba en 1440 y 390 px: entra con la contraseña, cada pantalla carga su
// título, cero desborde horizontal y cero errores de consola. Control
// positivo: una contraseña errónea TIENE que mostrar el error; si no, el
// oráculo está roto y falla.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const PASS = process.env.PANEL_SOCIAL_PASSWORD;
if (!PASS) { console.error("Falta PANEL_SOCIAL_PASSWORD"); process.exit(2); }
const cab = process.env.VERCEL_BYPASS ? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS } : {};
const PANTALLAS = [
  ["/social", "Inicio"], ["/social?f=pruebas", "Inicio"], ["/social/publicaciones?f=reels", "Publicaciones"],
  ["/social/atender", "Por atender"], ["/social/chats?f=todos", "Chats"], ["/social/automatizaciones", "Automatizaciones"],
  ["/social/landings?l=%2Fservinomic%2Flimpiaexpress", "Landings"], ["/social/contactos", "Contactos"], ["/social/ajustes", "Ajustes"],
];
const TOPE_MS = Number(process.env.TOPE_MS ?? 4000); // una página del panel no puede tardar más que esto
let fallos = 0;
const b = await chromium.launch();
for (const [w, h] of [[1440, 1000], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: cab });
  const p = await ctx.newPage();
  const errores = [];
  p.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
  await p.goto(`${BASE}/social`);
  // control positivo: la contraseña errónea debe mostrar el error
  await p.fill("#social-contrasena", "incorrecta-a-proposito");
  await p.click("button[type=submit]");
  const alerta = await p.waitForSelector("[role=alert]", { timeout: 15000 }).catch(() => null);
  if (!alerta) { console.log(`✗ ${w}px control positivo: la contraseña errónea no mostró error`); fallos++; }
  await p.fill("#social-contrasena", PASS);
  await p.click("button[type=submit]");
  await p.waitForSelector('h1:has-text("Inicio")', { timeout: 60000 });
  // una publicación real, tomada de la tabla
  const enlace = await p.$('a[href^="/social/publicaciones/"]');
  const rutas = [...PANTALLAS];
  if (enlace) rutas.push([await enlace.getAttribute("href"), null]);
  for (const [ruta, titulo] of rutas) {
    const t0 = Date.now();
    await p.goto(BASE + ruta, { waitUntil: "domcontentloaded", timeout: 90000 });
    const sel = titulo ? `h1:has-text("${titulo}")` : "h1";
    const ok = await p.locator(sel).first().waitFor({ timeout: 30000 }).then(() => true, () => false);
    const ms = Date.now() - t0;
    await p.waitForLoadState("networkidle").catch(() => {});
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const bien = ok && desborde <= 0 && ms <= TOPE_MS;
    if (!bien) fallos++;
    console.log(`${bien ? "✓" : "✗"} ${w}px ${ruta} · título ${ok ? "sí" : "NO"} · desborde ${desborde}px · ${ms} ms`);
  }
  if (errores.length) { fallos++; console.log(`✗ ${w}px errores de consola:\n  ${errores.join("\n  ")}`); }
  await ctx.close();
}
await b.close();
console.log(fallos ? `FALLÓ (${fallos})` : "social: todo en verde");
process.exit(fallos ? 1 : 0);
