import type { Acciones } from "./acciones";
import * as datos from "./datos";
import { evento } from "./db";
import { enlaceTarjeta } from "./enlaces";
import * as ig from "./instagram";
import { clasificarDm } from "./jev";
import { redactar } from "./redactor";
import { decidirRecurso, esToque, necesitaSaberSiSigue, PASOS_RECURSO } from "./recurso";
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

/** `bandeja`: el mensaje va a Por atender, pero la persona no sale de su paso. */
type Resultado = { paso: Paso; rama: string | null; accion: string; borrador?: string; bandeja?: boolean };

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

/** Flujo «recurso»: botón → (si se exige) ¿te sigue? → texto + tarjeta con el recurso. */
async function flujoRecurso(acc: Acciones, p: datos.Persona, texto: string, a: Automatizacion | null): Promise<Resultado> {
  const r = a?.textos.recurso;
  const toque = r ? esToque(texto, [r.botonEnviar, r.botonSeguido]) : false;
  // Sin configuración o sin landing no hay qué entregar: lo ve Victor.
  if (!r || !a?.landingUrl) {
    return { paso: p.paso, rama: "recurso", accion: "sin_recurso", bandeja: true,
      borrador: await redactar(texto, "responder su mensaje directo con amabilidad y ayudarle", a?.contexto) };
  }
  const sigue = toque && necesitaSaberSiSigue(p.paso, r.exigirSeguir) ? await ig.sigueALaCuenta(p.igsid) : null;
  const d = decidirRecurso(p.paso, toque, r.exigirSeguir, sigue);
  switch (d.tipo) {
    case "entregar":
      await acc.enviarTexto(p.igsid, r.entrega);
      await acc.enviarTarjeta(p.igsid, { ...r.tarjeta, url: enlaceTarjeta(a.landingUrl, p.codigo, `ig-${p.mediaId}`) });
      return { paso: d.paso, rama: "recurso", accion: sigue === null ? "recurso_enviado" : `recurso_enviado sigue=${sigue}` };
    case "pedir_seguir":
      await acc.enviarTexto(p.igsid, r.pedirSeguir, [r.botonSeguido]);
      return { paso: d.paso, rama: "recurso", accion: "pidio_seguir" };
    case "reintento":
      await acc.enviarTexto(p.igsid, r.reintento, [r.botonSeguido]);
      return { paso: d.paso, rama: "recurso", accion: "reintento_seguir" };
    case "bandeja":
      return { paso: p.paso, rama: "recurso", accion: "revision", bandeja: true,
        borrador: await redactar(texto, "responder su mensaje directo con amabilidad y ayudarle", a.contexto) };
  }
}

async function responder(acc: Acciones, p: datos.Persona, texto: string, a: Automatizacion | null): Promise<Resultado> {
  const t = a?.textos ?? TEXTOS_INICIALES;
  const umbral = a?.umbral ?? 0.7;
  if (PASOS_RECURSO.includes(p.paso)) return flujoRecurso(acc, p, texto, a);
  if (p.paso === "esperando_boton" || p.paso === "esperando_texto") {
    // Flujo de preguntas: con su primera respuesta le llega el enlace. Lo que
    // contestó queda en Chats para leerlo antes de la llamada.
    if (t.flujoDm === "preguntas") return { ...(await ramaSi(acc, p, a)), accion: "respondio_preguntas" };
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
  // La copia de la bandeja para Chats va cada 10 min; con personas en flujo,
  // la lista de conversaciones se pide una sola vez aquí abajo (antes se
  // pedía dos veces por ciclo, ~4 s cada una).
  await sincronizarBandeja(false, personas.size > 0 ? 0 : 4);
  if (!personas.size) return r;

  for (const conv of await ig.conversaciones(25)) {
    const otra = ig.interlocutor(conv, CUENTA);
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
        const aBandeja = res.paso === "revision" || res.bandeja === true;
        const estado = aBandeja ? "revision" : acc.simulacion ? "simulado" : "respondido";
        await datos.guardarMensaje({ id: m.id, igsid: p.igsid, texto: m.message, nuestro: false, ts: m.created_time,
          origen: "persona", accion: res.accion, estado, borrador: res.borrador ?? null });
        if (!acc.simulacion) {
          await datos.actualizarPersona(p.igsid, res.paso, res.rama, m.created_time);
          p = { ...p, paso: res.paso, rama: res.rama };
        }
        r[aBandeja ? "revision" : "respondidos"]++;
      } catch (e) {
        r.errores++;
        await evento(`Error con el mensaje de @${p.usuario}: ${(e as Error).message}`, "error", p.mediaId ?? undefined);
        return r; // no seguir con esa conversación: se reintenta en el próximo ciclo
      }
    }
  }
  return r;
}
