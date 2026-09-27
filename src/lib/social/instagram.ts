import { herramienta, proxy } from "./composio";
import type { Tarjeta } from "./tipos";

/** Operaciones de Instagram que usa el agente. Todo pasa por composio.ts. */

const API = "https://graph.instagram.com/v21.0";

export interface PublicacionIg {
  id: string;
  caption?: string;
  timestamp: string;
  permalink?: string;
  comments_count?: number;
  media_type?: string;
  media_product_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  is_shared_to_feed?: boolean;
}

export interface ComentarioIg {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  from?: { id: string; username: string };
  parent_id?: string;
  like_count?: number;
}

export interface MensajeIg {
  id: string;
  message?: string;
  created_time: string;
  from?: { id: string; username: string };
}

export async function publicaciones(limite = 25): Promise<PublicacionIg[]> {
  const r = await herramienta("INSTAGRAM_GET_IG_USER_MEDIA", {
    ig_user_id: "me",
    limit: limite,
    fields: "id,caption,timestamp,permalink,comments_count,media_type,media_product_type,thumbnail_url,media_url,is_shared_to_feed",
  });
  return r.data ?? [];
}

/** Comentarios de primer nivel (pagina hasta el final). */
export async function comentarios(mediaId: string): Promise<ComentarioIg[]> {
  const salida: ComentarioIg[] = [];
  let despues: string | undefined;
  for (let pagina = 0; pagina < 20; pagina++) {
    const args: Record<string, unknown> = {
      ig_media_id: mediaId, limit: 50,
      fields: "id,text,username,timestamp,from,parent_id,like_count",
    };
    if (despues) args.after = despues;
    const r = await herramienta("INSTAGRAM_GET_IG_MEDIA_COMMENTS", args);
    salida.push(...(r.data ?? []));
    despues = r.paging?.cursors?.after;
    if (!despues || !r.data?.length) break;
  }
  return salida;
}

export async function responderComentario(commentId: string, texto: string) {
  return herramienta("INSTAGRAM_POST_IG_COMMENT_REPLIES", { ig_comment_id: commentId, message: texto });
}

function botones(textos: string[]) {
  return textos.map((t, i) => ({ content_type: "text", title: t, payload: `B${i}` }));
}

/** El único mensaje directo permitido a quien comentó (≤ 7 días, una vez). */
export async function respuestaPrivada(commentId: string, texto: string, textosBotones?: string[]) {
  const message: Record<string, unknown> = { text: texto };
  if (textosBotones?.length) message.quick_replies = botones(textosBotones);
  return proxy("POST", `${API}/me/messages`, { recipient: { comment_id: commentId }, message });
}

export async function enviarTexto(igsid: string, texto: string, textosBotones?: string[]) {
  const message: Record<string, unknown> = { text: texto };
  if (textosBotones?.length) message.quick_replies = botones(textosBotones);
  return proxy("POST", `${API}/me/messages`, { recipient: { id: igsid }, message });
}

export async function enviarTarjeta(igsid: string, t: Tarjeta) {
  const message = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [{
          title: t.titulo, subtitle: t.subtitulo,
          default_action: { type: "web_url", url: t.url },
          buttons: [{ type: "web_url", url: t.url, title: t.boton }],
        }],
      },
    },
  };
  return proxy("POST", `${API}/me/messages`, { recipient: { id: igsid }, message });
}

export async function conversaciones(limite = 25): Promise<
  { id: string; updated_time: string; participants?: { data: { id: string; username: string }[] } }[]
> {
  const r = await herramienta("INSTAGRAM_LIST_ALL_CONVERSATIONS", { limit: limite, fields: "id,updated_time,participants" });
  return r.data ?? [];
}

export async function mensajes(conversationId: string, limite = 15): Promise<MensajeIg[]> {
  const r = await herramienta("INSTAGRAM_LIST_ALL_MESSAGES", {
    conversation_id: conversationId, limit: limite, fields: "id,from,message,created_time",
  });
  return r.data ?? [];
}

/**
 * Métricas de una publicación en UNA llamada (cada llamada por el sandbox
 * cuesta 3-5 s). Meta rechaza la petición entera si una métrica no aplica al
 * tipo, por eso hay una lista para reels y otra para el resto. Verificado
 * contra la API el 27 sep 2026.
 */
const METRICAS_REEL = "views,reach,saved,shares,likes,comments,ig_reels_avg_watch_time,reels_skip_rate";
const METRICAS_POST = "views,reach,saved,shares,likes,comments";

export async function metricas(mediaId: string, tipo: string | null): Promise<Record<string, number>> {
  const lista = tipo === "REELS" ? METRICAS_REEL : METRICAS_POST;
  const salida: Record<string, number> = {};
  const r = await proxy("GET", `${API}/${mediaId}/insights`, undefined, { metric: lista });
  for (const m of r?.data ?? []) {
    const v = m?.values?.[0]?.value ?? m?.total_value?.value;
    if (typeof v === "number") salida[m.name] = v;
  }
  return salida;
}
