import { Acciones } from "./acciones";
import { cicloComentarios } from "./ciclo-comentarios";
import { cicloMensajes } from "./ciclo-mensajes";
import { ajuste, asegurarEsquema, evento, fijarAjuste, soltarCandado, tomarCandado } from "./db";

/**
 * Un ciclo del agente. Lo dispara el reloj externo cada minuto.
 * El candado caduca a los 90 s: si una ejecución muere por el tope de tiempo
 * de Vercel, la siguiente puede entrar sin quedar bloqueada para siempre.
 */
export async function correrCiclo() {
  await asegurarEsquema();
  if ((await ajuste("pausado")) === "1") return { estado: "pausado" };
  if (!(await tomarCandado(90))) return { estado: "ocupado" };

  const acc = new Acciones((await ajuste("simulacion")) === "1");
  try {
    const comentarios = await cicloComentarios(acc);
    const mensajes = await cicloMensajes(acc);
    await fijarAjuste("ultimo_ciclo", new Date().toISOString());
    await fijarAjuste("fallos_seguidos", "0");
    return { estado: "ok", simulacion: acc.simulacion, acciones: acc.hechas, comentarios, mensajes };
  } catch (e) {
    const fallos = Number((await ajuste("fallos_seguidos")) ?? "0") + 1;
    await fijarAjuste("fallos_seguidos", String(fallos));
    await evento(`El ciclo falló: ${(e as Error).message}`, "error");
    if (fallos === 5) await evento("El agente falló 5 veces seguidas. Revisa los errores.", "alerta");
    return { estado: "error", error: (e as Error).message.slice(0, 300) };
  } finally {
    await soltarCandado();
  }
}
