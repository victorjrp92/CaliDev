import type { Acciones } from "./acciones";
import * as datos from "./datos";
import { evento } from "./db";
import { codigoPersona } from "./enlaces";
import * as ig from "./instagram";
import { clasificarComentario } from "./jev";
import { redactar } from "./redactor";
import { accionFinal, decidir, puedeRespuestaPrivada, siguienteRevision, fechaIg } from "./reglas";
import type { Accion, Automatizacion } from "./tipos";

const CUENTA = "calidevdev";

const OBJETIVO_IA: Record<string, string> = {
  felicitacion: "agradecer con calidez la felicitación o los buenos deseos",
  etiqueta_emoji: "agradecer que comparta o reaccione, muy corto",
  quiere_contacto: "agradecer su interés y decirle que le escribimos por mensaje directo",
  otro: "responder con amabilidad",
};

const alAzar = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export interface ResumenComentarios {
  revisadas: number; nuevos: number; respondidos: number; revision: number; alertas: number; errores: number;
}

/** Texto de la respuesta pública según la acción (null = no se responde). */
async function textoPublico(accion: Accion, tipo: string, texto: string, a: Automatizacion) {
  switch (accion) {
    case "ia": return redactar(texto, OBJETIVO_IA[tipo] ?? OBJETIVO_IA.otro, a.contexto);
    case "contacto": return redactar(texto, OBJETIVO_IA.quiere_contacto, a.contexto);
    case "fijo_aliado": return alAzar(a.textos.pubAliado);
    case "fijo_critica": return alAzar(a.textos.pubCritica);
    case "revision": return redactar(texto, OBJETIVO_IA.otro, a.contexto); // borrador
    case "ignorar": return null;
  }
}

async function procesar(c: ig.ComentarioIg, a: Automatizacion, acc: Acciones, r: ResumenComentarios) {
  const usuario = c.from?.username ?? c.username ?? null;
  const igsid = c.from?.id ?? null;
  const { tipo, confianza } = await clasificarComentario(c.text, a.contexto);
  const accion = accionFinal(decidir(tipo, confianza, a), c.text, a);
  const respuesta = await textoPublico(accion, tipo, c.text, a);

  const reservado = await datos.reservarComentario({
    id: c.id, mediaId: a.mediaId, usuario, igsid, texto: c.text, ts: c.timestamp,
    tipo, confianza, accion, respuesta, meGusta: c.like_count ?? null,
  });
  if (!reservado) return; // otro ciclo ya lo tomó

  if (accion === "revision") {
    await datos.confirmarComentario(c.id, "revision");
    r.revision++;
    return;
  }
  if (accion === "ignorar") {
    await datos.confirmarComentario(c.id, "alerta");
    await evento(`Ofensa o spam de @${usuario} (sin responder): ${c.text.slice(0, 120)}`, "alerta", a.mediaId);
    r.alertas++;
    return;
  }

  try {
    await acc.responderComentario(c.id, respuesta!);
    if (accion === "contacto" && igsid && puedeRespuestaPrivada(c.timestamp) && !(await datos.persona(igsid))) {
      await acc.respuestaPrivada(c.id, a.textos.pregunta, [a.textos.botonSi, a.textos.botonNo, a.textos.botonAliado]);
      if (!acc.simulacion) {
        await datos.crearPersona({
          igsid, usuario, codigo: codigoPersona(igsid, process.env.SOCIAL_SAL ?? "calidev"),
          mediaId: a.mediaId, commentId: c.id, paso: "esperando_boton", desde: new Date().toISOString(),
        });
      }
    }
    await datos.confirmarComentario(c.id, acc.simulacion ? "simulado" : "respondido");
    if (accion === "fijo_critica") {
      await evento(`Crítica de @${usuario}: ${c.text.slice(0, 120)}`, "alerta", a.mediaId);
      r.alertas++;
    }
    r.respondidos++;
  } catch (e) {
    await datos.confirmarComentario(c.id, "error", (e as Error).message.slice(0, 300));
    await evento(`Error respondiendo a @${usuario}: ${(e as Error).message}`, "error", a.mediaId);
    r.errores++;
  }
}

export async function cicloComentarios(acc: Acciones): Promise<ResumenComentarios> {
  const r: ResumenComentarios = { revisadas: 0, nuevos: 0, respondidos: 0, revision: 0, alertas: 0, errores: 0 };
  const pendientes = await datos.automatizacionesPendientes();
  if (!pendientes.length) return r;

  // Una sola llamada para saber qué publicaciones tienen algo nuevo.
  const conteos = new Map((await ig.publicaciones(50)).map((p) => [p.id, p.comments_count ?? 0]));

  for (const a of pendientes) {
    const conteo = conteos.get(a.mediaId) ?? 0;
    const edad = Date.now() - (a.activadoEn ? Date.parse(a.activadoEn) : Date.now());
    const proxima = siguienteRevision(edad);
    if (proxima === null) {
      await evento("Automatización apagada: pasaron 14 días desde que se activó", "info", a.mediaId);
    }
    let completo = true;
    if (conteo !== a.conteoVisto) {
      r.revisadas++;
      const vistos = await datos.idsComentarios(a.mediaId);
      const nuevos = (await ig.comentarios(a.mediaId))
        .filter((c) => !vistos.has(c.id) && !c.parent_id)
        .filter((c) => (c.from?.username ?? c.username) !== CUENTA)
        .filter((c) => !a.activadoEn || fechaIg(c.timestamp) >= Date.parse(a.activadoEn))
        .sort((x, y) => fechaIg(x.timestamp) - fechaIg(y.timestamp));
      for (const c of nuevos) {
        if (!acc.caben(2)) { completo = false; break; }
        r.nuevos++;
        try {
          await procesar(c, a, acc, r);
        } catch (e) {
          // Falló antes de reservar (Jev, DeepSeek, red): no salió nada a
          // Instagram. No se da el conteo por visto, así se reintenta.
          completo = false;
          r.errores++;
          await evento(`No se pudo procesar un comentario: ${(e as Error).message}`, "error", a.mediaId);
        }
      }
    }
    // Si no alcanzó el tope, el conteo se da por visto; si no, se revisa en el próximo minuto.
    await datos.programarRevision(a.mediaId, completo ? proxima : 60_000, completo ? conteo : a.conteoVisto);
    if (!acc.caben(2)) break;
  }
  return r;
}
