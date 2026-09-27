import type { Acciones } from "./acciones";
import * as datos from "./datos";
import { evento } from "./db";
import { enlaceTarjeta } from "./enlaces";
import * as ig from "./instagram";
import { clasificarDm } from "./jev";
import { redactar } from "./redactor";
import { reconocerBoton, ventanaAbierta, fechaIg } from "./reglas";
import { sincronizarBandeja } from "./sincronizar-chats";
import { TEXTOS_INICIALES } from "./textos";
import type { Automatizacion, Paso } from "./tipos";

/**
 * Mensajes directos de las personas que entraron por un comentario. Solo se
 * actúa sobre mensajes posteriores a su entrada; los mensajes espontáneos no
 * se responden solos (decisión de Victor): se ven en Chats.
 */
const CUENTA = "calidevdev";

export interface ResumenMensajes { mensajes: number; respondidos: number; revision: number; errores: number }

type Resultado = { paso: Paso; rama: string | null; accion: string; borrador?: string };

async function ramaSi(acc: Acciones, p: datos.Persona, a: Automatizacion | null): Promise<Resultado> {
  const t = a?.textos ?? TEXTOS_INICIALES;
  const landing = a?.landingUrl;
  if (!landing) {
    // Sin landing configurada no hay a dónde mandar: Victor responde.
    return { paso: "revision", rama: "negocio", accion: "sin_landing",
      borrador: await redactar("Sí, tengo negocio", "invitarle a contarnos de su negocio para ayudarle") };
  }
  await acc.enviarTexto(p.igsid, t.si);
  await acc.enviarTarjeta(p.igsid, { ...t.tarjetaSi, url: enlaceTarjeta(landing, p.codigo, `ig-${p.mediaId}`) });
  return { paso: "asesoria_enviada", rama: "negocio", accion: "tarjeta_si" };
}

async function ramaAliado(acc: Acciones, p: datos.Persona, a: Automatizacion | null): Promise<Resultado> {
  const t = a?.textos ?? TEXTOS_INICIALES;
  await acc.enviarTexto(p.igsid, t.aliado);
  await acc.enviarTarjeta(p.igsid, t.tarjetaAliado);
  return { paso: "enviado_aliado", rama: "aliado", accion: "tarjeta_aliado" };
}

async function responder(acc: Acciones, p: datos.Persona, texto: string, a: Automatizacion | null): Promise<Resultado> {
  const t = a?.textos ?? TEXTOS_INICIALES;
  const umbral = a?.umbral ?? 0.7;
  if (p.paso === "esperando_boton" || p.paso === "esperando_texto") {
    const boton = reconocerBoton(texto, t);
    if (boton === "si") return ramaSi(acc, p, a);
    if (boton === "aliado") return ramaAliado(acc, p, a);
    if (boton === "no" && p.paso === "esperando_boton") {
      await acc.enviarTexto(p.igsid, t.no);
      return { paso: "esperando_texto", rama: null, accion: "boton_no" };
    }
    const { rama, confianza } = await clasificarDm(texto);
    if (confianza >= umbral && rama === "negocio") return { ...(await ramaSi(acc, p, a)), accion: `jev_negocio ${confianza.toFixed(2)}` };
    if (confianza >= umbral && rama === "limpiaexpress") return { ...(await ramaAliado(acc, p, a)), accion: `jev_aliado ${confianza.toFixed(2)}` };
  }
  return {
    paso: "revision", rama: p.rama, accion: "revision",
    borrador: await redactar(texto, "responder su mensaje directo con amabilidad y ayudarle", a?.contexto),
  };
}

export async function cicloMensajes(acc: Acciones): Promise<ResumenMensajes> {
  const r: ResumenMensajes = { mensajes: 0, respondidos: 0, revision: 0, errores: 0 };
  const personas = new Map((await datos.personasEnFlujo()).map((p) => [p.igsid, p]));
  // Con personas esperando respuesta se consulta cada ciclo; si no, cada 10 min (para que Chats esté al día).
  await sincronizarBandeja(personas.size > 0, personas.size > 0 ? 0 : 4);
  if (!personas.size) return r;

  for (const conv of await ig.conversaciones(25)) {
    const otra = conv.participants?.data.find((u) => u.username !== CUENTA);
    const persona = otra && personas.get(otra.id);
    if (!persona) continue;
    const vistos = await datos.idsMensajes(persona.igsid);
    const nuevos = (await ig.mensajes(conv.id, 15))
      .filter((m) => !vistos.has(m.id) && fechaIg(m.created_time) > Date.parse(persona.desde))
      .sort((x, y) => fechaIg(x.created_time) - fechaIg(y.created_time));
    const automatizacion = persona.mediaId ? await datos.automatizacion(persona.mediaId) : null;
    let p = persona;

    for (const m of nuevos) {
      const nuestro = m.from?.username === CUENTA;
      if (nuestro || !m.message) {
        await datos.guardarMensaje({ id: m.id, igsid: p.igsid, texto: m.message ?? null, nuestro,
          ts: m.created_time, origen: nuestro ? "agente" : "persona" });
        continue;
      }
      if (!acc.caben(2)) return r;
      r.mensajes++;
      if (!ventanaAbierta(m.created_time)) {
        await evento(`Mensaje de @${p.usuario} fuera de la ventana de 24 h: no se respondió`, "alerta", p.mediaId ?? undefined);
        await datos.guardarMensaje({ id: m.id, igsid: p.igsid, texto: m.message, nuestro: false,
          ts: m.created_time, origen: "persona", estado: "vencido" });
        continue;
      }
      try {
        const res = await responder(acc, p, m.message, automatizacion);
        const estado = res.paso === "revision" ? "revision" : acc.simulacion ? "simulado" : "respondido";
        await datos.guardarMensaje({ id: m.id, igsid: p.igsid, texto: m.message, nuestro: false, ts: m.created_time,
          origen: "persona", accion: res.accion, estado, borrador: res.borrador ?? null });
        if (!acc.simulacion) {
          await datos.actualizarPersona(p.igsid, res.paso, res.rama, m.created_time);
          p = { ...p, paso: res.paso, rama: res.rama };
        }
        r[res.paso === "revision" ? "revision" : "respondidos"]++;
      } catch (e) {
        r.errores++;
        await evento(`Error con el mensaje de @${p.usuario}: ${(e as Error).message}`, "error", p.mediaId ?? undefined);
        return r; // no seguir con esa conversación: se reintenta en el próximo ciclo
      }
    }
  }
  return r;
}
