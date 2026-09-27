import { chromium } from "playwright";
const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
const errores = [];
p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 300)));
p.on("pageerror", (e) => errores.push("pageerror: " + e.message.slice(0, 300)));
await p.goto("http://localhost:3100/social"); await p.fill("#social-contrasena", process.env.PANEL_SOCIAL_PASSWORD); await p.click("button[type=submit]");
await p.waitForSelector("h1:has-text(\"Inicio\")");
for (const r of process.argv.slice(2)) { await p.goto("http://localhost:3100" + r, { waitUntil: "networkidle" }); await p.waitForTimeout(1500); }
console.log(errores.length ? errores.join("\n---\n") : "sin errores de consola");
await b.close();
