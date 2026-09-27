// Mide cuánto tarda cada pieza que carga una página del panel.
import { asegurarEsquema } from "../../src/lib/social/db";
import * as q from "../../src/lib/social/consultas";
import { conversaciones } from "../../src/lib/social/instagram";
import { sincronizarMensajes } from "../../src/lib/social/sincronizar-chats";
import { sql } from "../../src/lib/db";

async function t(n: string, f: () => Promise<unknown>) {
  const a = Date.now();
  try { await f(); console.log(`${(Date.now() - a).toString().padStart(6)} ms  ${n}`); }
  catch (e) { console.log(`${(Date.now() - a).toString().padStart(6)} ms  ${n}  FALLÓ ${(e as Error).message.slice(0, 80)}`); }
}
async function main() {
  await t("sql SELECT 1 (ida y vuelta a Neon)", () => sql`SELECT 1`);
  await t("sql SELECT 1 otra vez", () => sql`SELECT 1`);
  await t("asegurarEsquema (arranque en frío)", () => asegurarEsquema());
  await t("contadoresMenu (layout)", () => q.contadoresMenu());
  await t("kpisInicio", () => q.kpisInicio());
  await t("tablaPublicaciones", () => q.tablaPublicaciones());
  await t("porAtender", () => q.porAtender());
  await t("datosAjustes", () => q.datosAjustes());
  await t("detallePublicacion", () => q.detallePublicacion("18222221302331797"));
  await t("comentariosDe", () => q.comentariosDe("18222221302331797"));
  await t("personasTodas (chats)", () => q.personasTodas());
  await t("conversacionesEspontaneas (chats, base)", () => q.conversacionesEspontaneas());
  await t("mensajesDe (chat abierto, base)", () => q.mensajesDe("1010871755112354"));
  await t("Composio conversaciones (solo botón Actualizar / reloj)", () => conversaciones(25));
  await t("Composio sincronizarMensajes (solo botón Actualizar)", () => sincronizarMensajes("1010871755112354"));
}
main().then(() => process.exit(0));
