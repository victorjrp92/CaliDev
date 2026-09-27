import { chromium } from "playwright";
const base = "http://localhost:3100", pass = process.env.PANEL_SOCIAL_PASSWORD, out = process.argv[2];
const rutas = (process.argv[3] ?? "/social").split(",");
const b = await chromium.launch();
for (const [ancho, alto] of [[1440, 1000], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto } });
  const p = await ctx.newPage();
  await p.goto(base + "/social");
  await p.fill("#social-contrasena", pass);
  await p.click("button[type=submit]");
  await p.waitForSelector("h1:has-text(\"Inicio\")", { timeout: 60000 });
  if (ancho === 1440 && process.argv[4] === "sync") {
    const r = await p.evaluate(() => fetch("/api/social/publicaciones", { method: "POST" }).then((x) => x.json()));
    console.log("sync:", JSON.stringify(r));
  }
  for (const ruta of rutas) {
    await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 90000 });
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const nombre = `${out}/${ruta.replace(/\W+/g, "_")}-${ancho}.png`;
    await p.screenshot({ path: nombre, fullPage: true });
    console.log(ancho, ruta, "desborde horizontal:", desborde, "px");
  }
  await ctx.close();
}
await b.close();
