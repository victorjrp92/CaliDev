// Prueba del seguimiento de la landing (local). Genera una visita con código de prueba.
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(e.message.slice(0, 200)));
await p.goto("http://localhost:3100/servinomic/limpiaexpress?utm_source=instagram&c=prueba0002", { waitUntil: "networkidle" });
for (let y = 0; y < 12; y++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(250); }
const h = await p.$("[data-seccion=caso] h2, [data-seccion=caso] p");
const box = await h.boundingBox();
for (let i = 0; i < 3; i++) await p.mouse.click(box.x + 20, box.y + 5, { delay: 20 });
await p.locator("#registro").scrollIntoViewIfNeeded();
const opcion = p.locator("#registro button, #registro label").first();
await opcion.click();
await p.waitForTimeout(800);
await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await p.close(); await b.close();
console.log(errores.length ? "errores: " + errores.join(" | ") : "sin errores en la landing");
