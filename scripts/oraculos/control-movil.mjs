/**
 * Control positivo de `movil.mjs`.
 *
 * Devuelve la sección de servicios a la tira horizontal que tenía —la que en un
 * teléfono mostraba un panel de seis— y exige que el oráculo la SUSPENDA. Si
 * pasara, el oráculo estaría ciego y su verde no valdría nada, que es
 * exactamente lo que pasó con los otros ocho mientras la página estuvo rota en
 * móvil: todos en verde, ninguno mirando un teléfono.
 *
 * Comparte el cuerpo con el oráculo a propósito. Un control que reimplementa la
 * medida no prueba el oráculo, prueba otra cosa.
 */
import { chromium, devices } from "playwright";
import { BASE } from "./rutas.mjs";
import { medir, juzgar } from "./movil.mjs";

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ ...devices["iPhone 13"] });
const pagina = await contexto.newPage();
await pagina.goto(`${BASE}/es`, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
await pagina.waitForTimeout(2000);

const medida = await medir(pagina, { forzarViejo: true });
const motivos = juzgar(medida);
await navegador.close();

if (motivos.length) {
  console.log(`ok     el oráculo caza la maqueta vieja — ${motivos.join("; ")}`);
  console.log("\nel control positivo falla como debe");
  process.exit(0);
}

console.log(`FALLA  con la tira horizontal de vuelta el oráculo dio verde`);
console.log(`       medida: ${JSON.stringify(medida)}`);
console.log("\nel oráculo de móvil está ciego");
process.exit(1);
