import { sql } from "@/lib/db";
import { fechaHora } from "./fecha";

/** Consultas de lectura del panel. Las de escritura del agente viven en datos.ts. */

export async function contadoresMenu() {
  const { rows } = await sql`
    SELECT
      (SELECT COUNT(*) FROM social_comentarios WHERE estado IN ('revision','error'))
      + (SELECT COUNT(*) FROM social_mensajes WHERE estado = 'revision') AS por_atender,
      (SELECT COUNT(*) FROM social_personas WHERE paso = 'revision') AS chats`;
  return { porAtender: Number(rows[0].por_atender), chats: Number(rows[0].chats) };
}

export async function datosAjustes() {
  const mes = new Date().toISOString().slice(0, 7);
  const [ajustes, consumo, eventos] = await Promise.all([
    sql`SELECT clave, valor FROM social_ajustes`,
    sql`SELECT servicio, llamadas FROM social_consumo WHERE mes = ${mes}`,
    sql`SELECT ts, nivel, texto FROM social_eventos ORDER BY ts DESC LIMIT 30`,
  ]);
  const a = Object.fromEntries(ajustes.rows.map((r) => [r.clave, r.valor]));
  return {
    pausado: a.pausado === "1",
    simulacion: a.simulacion === "1",
    ultimoCiclo: a.ultimo_ciclo ?? null,
    /** Minutos desde el último ciclo (null si nunca corrió). Se calcula aquí, no en el render. */
    minutosDesdeCiclo: a.ultimo_ciclo ? Math.round((Date.now() - Date.parse(a.ultimo_ciclo)) / 60_000) : null,
    fallosSeguidos: Number(a.fallos_seguidos ?? 0),
    consumo: Object.fromEntries(consumo.rows.map((r) => [r.servicio, Number(r.llamadas)])) as Record<string, number>,
    eventos: eventos.rows.map((r) => ({ ts: new Date(r.ts).toISOString(), nivel: r.nivel as string, texto: r.texto as string })),
  };
}

// ---------- Inicio ----------

export interface FilaPublicacion {
  mediaId: string; titulo: string; permalink: string | null; miniatura: string | null; tipo: string | null;
  publicado: string; modo: string | null; sensible: boolean; landing: string | null;
  vistas: number | null; comentarios: number; interesados: number; leads: number; revision: number; enPerfil: boolean | null;
}

function titulo(caption: string | null) {
  const t = (caption ?? "").split("\n")[0].trim();
  return t.length > 70 ? `${t.slice(0, 67)}…` : t || "(sin texto)";
}

export async function tablaPublicaciones(): Promise<FilaPublicacion[]> {
  const { rows } = await sql`
    SELECT p.media_id, p.caption, p.permalink, p.miniatura, p.tipo, p.publicado, p.conteo_ig, p.en_perfil,
      a.modo, a.sensible, a.landing_url,
      (SELECT vistas FROM social_metricas m WHERE m.media_id = p.media_id ORDER BY medido_en DESC LIMIT 1) AS vistas,
      (SELECT COUNT(*) FROM social_comentarios c WHERE c.media_id = p.media_id) AS procesados,
      (SELECT COUNT(*) FROM social_comentarios c WHERE c.media_id = p.media_id AND c.tipo = 'quiere_contacto') AS interesados,
      (SELECT COUNT(*) FROM social_personas s WHERE s.media_id = p.media_id AND s.rama = 'negocio') AS leads,
      (SELECT COUNT(*) FROM social_comentarios c WHERE c.media_id = p.media_id AND c.estado IN ('revision','error')) AS revision
    FROM social_publicaciones p LEFT JOIN social_automatizaciones a USING (media_id)
    ORDER BY p.publicado DESC NULLS LAST LIMIT 60`;
  return rows.map((r) => ({
    mediaId: r.media_id, titulo: titulo(r.caption), permalink: r.permalink, miniatura: r.miniatura, tipo: r.tipo,
    publicado: r.publicado ? new Date(r.publicado).toISOString() : "", modo: r.modo, sensible: Boolean(r.sensible),
    landing: r.landing_url, vistas: r.vistas === null ? null : Number(r.vistas),
    comentarios: Math.max(Number(r.conteo_ig ?? 0), Number(r.procesados)), interesados: Number(r.interesados),
    leads: Number(r.leads), revision: Number(r.revision), enPerfil: r.en_perfil === null ? null : Boolean(r.en_perfil),
  }));
}

export async function kpisInicio() {
  const { rows } = await sql`
    SELECT
      (SELECT COUNT(*) FROM social_automatizaciones WHERE modo <> 'apagado') AS automatizadas,
      (SELECT COUNT(*) FROM social_publicaciones) AS publicaciones,
      (SELECT COUNT(*) FROM social_comentarios WHERE ts > NOW() - INTERVAL '30 days') AS comentarios,
      (SELECT COUNT(*) FROM social_comentarios WHERE estado IN ('respondido')
         AND ts > NOW() - INTERVAL '30 days') AS respondidos,
      (SELECT COUNT(*) FROM social_personas WHERE rama = 'negocio') AS leads,
      (SELECT COUNT(*) FROM leads WHERE social_codigo IS NOT NULL) AS formularios`;
  const r = rows[0];
  return {
    automatizadas: Number(r.automatizadas), publicaciones: Number(r.publicaciones), comentarios: Number(r.comentarios),
    respondidos: Number(r.respondidos), leads: Number(r.leads), formularios: Number(r.formularios),
  };
}

// ---------- Por atender ----------

export interface ItemAtender {
  clase: "comentario" | "mensaje"; id: string; mediaId: string | null; publicacion: string | null;
  usuario: string | null; igsid: string | null; texto: string; tipo: string | null; confianza: number | null;
  estado: string; borrador: string | null; error: string | null; ts: string; cuando: string;
}

export async function porAtender(): Promise<ItemAtender[]> {
  const [c, m] = await Promise.all([
    sql`SELECT c.*, p.caption FROM social_comentarios c LEFT JOIN social_publicaciones p USING (media_id)
        WHERE c.estado IN ('revision','error','alerta') ORDER BY c.ts ASC LIMIT 100`,
    sql`SELECT m.*, s.usuario, s.media_id, p.caption FROM social_mensajes m
        JOIN social_personas s USING (igsid) LEFT JOIN social_publicaciones p ON p.media_id = s.media_id
        WHERE m.estado = 'revision' ORDER BY m.ts ASC LIMIT 100`,
  ]);
  return [
    ...c.rows.map((r) => ({
      clase: "comentario" as const, id: r.id, mediaId: r.media_id, publicacion: r.caption ? titulo(r.caption) : null,
      usuario: r.usuario, igsid: r.igsid, texto: r.texto, tipo: r.tipo, confianza: r.confianza === null ? null : Number(r.confianza),
      estado: r.estado, borrador: r.respuesta, error: r.error, ts: new Date(r.ts).toISOString(), cuando: fechaHora(new Date(r.ts).toISOString()),
    })),
    ...m.rows.map((r) => ({
      clase: "mensaje" as const, id: r.id, mediaId: r.media_id, publicacion: r.caption ? titulo(r.caption) : null,
      usuario: r.usuario, igsid: r.igsid, texto: r.texto ?? "", tipo: null, confianza: null,
      estado: r.estado, borrador: r.borrador, error: null, ts: new Date(r.ts).toISOString(), cuando: fechaHora(new Date(r.ts).toISOString()),
    })),
  ].sort((a, b) => a.ts.localeCompare(b.ts));
}

// ---------- Publicación ----------

export async function detallePublicacion(mediaId: string) {
  const [p, ult, emb, vid] = await Promise.all([
    sql`SELECT p.*, a.modo, a.sensible, a.landing_url, a.palabras_clave, a.activado_en, a.proxima_revision
        FROM social_publicaciones p LEFT JOIN social_automatizaciones a USING (media_id) WHERE p.media_id = ${mediaId}`,
    sql`SELECT * FROM social_metricas WHERE media_id = ${mediaId} ORDER BY medido_en DESC LIMIT 1`,
    sql`SELECT
          (SELECT COUNT(*) FROM social_comentarios WHERE media_id = ${mediaId}) AS comentaron,
          (SELECT COUNT(*) FROM social_personas WHERE media_id = ${mediaId}) AS mensaje,
          (SELECT COUNT(*) FROM social_personas WHERE media_id = ${mediaId} AND rama = 'negocio') AS si,
          (SELECT COUNT(DISTINCT v.codigo) FROM social_visitas v JOIN social_personas s ON s.codigo = v.codigo
             WHERE s.media_id = ${mediaId}) AS landing,
          (SELECT COUNT(*) FROM leads l JOIN social_personas s ON s.codigo = l.social_codigo
             WHERE s.media_id = ${mediaId}) AS formulario`,
    sql`SELECT * FROM social_video WHERE media_id = ${mediaId}`,
  ]);
  if (!p.rows[0]) return null;
  const r = p.rows[0];
  const e = emb.rows[0];
  return {
    mediaId, titulo: titulo(r.caption), caption: r.caption as string | null, permalink: r.permalink as string | null,
    miniatura: r.miniatura as string | null, tipo: r.tipo as string | null,
    publicado: r.publicado ? new Date(r.publicado).toISOString() : null,
    modo: (r.modo ?? null) as string | null, sensible: Boolean(r.sensible), landing: r.landing_url as string | null,
    palabrasClave: (r.palabras_clave ?? []) as string[],
    metricas: ult.rows[0] ?? null,
    embudo: {
      comentaron: Number(e.comentaron), mensaje: Number(e.mensaje), si: Number(e.si),
      landing: Number(e.landing), formulario: Number(e.formulario),
    },
    video: vid.rows[0] ?? null,
  };
}

export async function comentariosDe(mediaId: string) {
  const { rows } = await sql`SELECT * FROM social_comentarios WHERE media_id = ${mediaId} ORDER BY ts DESC LIMIT 300`;
  return rows.map((r) => ({
    id: r.id as string, usuario: r.usuario as string | null, texto: r.texto as string, tipo: r.tipo as string | null,
    tipoCorregido: r.tipo_corregido as string | null, confianza: r.confianza === null ? null : Number(r.confianza),
    accion: r.accion as string | null, respuesta: r.respuesta as string | null, estado: r.estado as string,
    meGusta: r.me_gusta === null ? null : Number(r.me_gusta), ts: new Date(r.ts).toISOString(), cuando: fechaHora(new Date(r.ts).toISOString()),
  }));
}

export async function listaPublicacionesCorta() {
  const { rows } = await sql`SELECT media_id, caption, miniatura FROM social_publicaciones ORDER BY publicado DESC NULLS LAST LIMIT 30`;
  return rows.map((r) => ({ mediaId: r.media_id as string, titulo: titulo(r.caption), miniatura: r.miniatura as string | null }));
}

// ---------- Landing y mapa de calor ----------

/** Orden real de las secciones de la landing delegar (data-seccion). */
export const SECCIONES_LANDING = ["propuesta", "caso", "servicio", "despues", "formulario", "detalle", "preguntas", "cierre"];

/**
 * `mediaId` acota "de esta publicación"; sin él (página Landings) cuenta toda
 * visita que traiga código, es decir toda la que vino de Instagram. Antes se
 * cruzaba contra cadena vacía y el contador daba siempre 0.
 */
export async function mapaLanding(ruta: string, mediaId: string | null) {
  const [v, cl] = await Promise.all([
    sql`SELECT v.*,
          CASE WHEN ${mediaId}::text IS NULL THEN (v.codigo IS NOT NULL) ELSE (s.igsid IS NOT NULL) END AS de_esta
        FROM social_visitas v LEFT JOIN social_personas s ON s.codigo = v.codigo AND s.media_id = ${mediaId}
        WHERE v.landing = ${ruta} AND v.inicio > NOW() - INTERVAL '30 days'`,
    sql`SELECT c.selector, c.seccion, COUNT(*) AS n, SUM(c.muerto::int) AS muertos, SUM(c.rabia::int) AS rabia
        FROM social_clics c JOIN social_visitas v ON v.id = c.visita_id
        WHERE v.landing = ${ruta} AND v.inicio > NOW() - INTERVAL '30 days'
        GROUP BY c.selector, c.seccion ORDER BY n DESC LIMIT 12`,
  ]);
  const visitas = v.rows;
  const total = visitas.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const secciones = SECCIONES_LANDING.map((s) => ({
    seccion: s, pct: pct(visitas.filter((x) => (x.secciones as string[]).includes(s)).length),
  }));
  const pasos = [1, 2, 3, 4].map((p) => ({ paso: p, n: visitas.filter((x) => Number(x.paso_formulario) >= p).length }));
  return {
    ruta, total, desdeEsta: visitas.filter((x) => x.de_esta).length,
    celular: pct(visitas.filter((x) => x.dispositivo === "celular").length),
    scrollMedio: total ? Math.round((visitas.reduce((a, x) => a + Number(x.max_scroll), 0) / total) * 100) : 0,
    secciones, pasos,
    clics: cl.rows.map((r) => ({ selector: r.selector as string, seccion: r.seccion as string | null,
      n: Number(r.n), muertos: Number(r.muertos), rabia: Number(r.rabia) })),
  };
}

// ---------- Chats ----------

export async function personasTodas() {
  const { rows } = await sql`
    SELECT s.*, p.caption, c.texto AS comentario,
      (SELECT MAX(ts) FROM social_mensajes m WHERE m.igsid = s.igsid) AS ultimo,
      (SELECT texto FROM social_mensajes m WHERE m.igsid = s.igsid ORDER BY ts DESC LIMIT 1) AS ultimo_texto,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.codigo = s.codigo) AS visitas
    FROM social_personas s LEFT JOIN social_publicaciones p ON p.media_id = s.media_id
    LEFT JOIN social_comentarios c ON c.id = s.comment_id
    ORDER BY COALESCE((SELECT MAX(ts) FROM social_mensajes m WHERE m.igsid = s.igsid), s.desde) DESC LIMIT 200`;
  return rows.map((r) => ({
    igsid: r.igsid as string, usuario: r.usuario as string | null, paso: r.paso as string, rama: r.rama as string | null,
    publicacion: r.caption ? titulo(r.caption) : null, mediaId: r.media_id as string | null,
    comentario: r.comentario as string | null, ultimo: r.ultimo ? new Date(r.ultimo).toISOString() : new Date(r.desde).toISOString(),
    ultimoTexto: r.ultimo_texto as string | null, visitas: Number(r.visitas),
  }));
}

export async function fichaPersona(igsid: string) {
  const { rows } = await sql`
    SELECT s.*, p.caption, c.texto AS comentario,
      (SELECT MAX(max_scroll) FROM social_visitas v WHERE v.codigo = s.codigo) AS scroll,
      (SELECT MAX(paso_formulario) FROM social_visitas v WHERE v.codigo = s.codigo) AS paso_form,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.codigo = s.codigo) AS visitas,
      (SELECT COUNT(*) FROM leads l WHERE l.social_codigo = s.codigo) AS leads
    FROM social_personas s LEFT JOIN social_publicaciones p ON p.media_id = s.media_id
    LEFT JOIN social_comentarios c ON c.id = s.comment_id WHERE s.igsid = ${igsid}`;
  const r = rows[0];
  if (!r) return null;
  return {
    igsid, usuario: r.usuario as string | null, paso: r.paso as string, rama: r.rama as string | null,
    publicacion: r.caption ? titulo(r.caption) : null, mediaId: r.media_id as string | null, comentario: r.comentario as string | null,
    etiquetas: (r.etiquetas ?? []) as string[], nota: r.nota as string | null,
    visitas: Number(r.visitas), scroll: r.scroll === null ? null : Math.round(Number(r.scroll) * 100),
    pasoFormulario: Number(r.paso_form ?? 0), dejoDatos: Number(r.leads) > 0,
    ultimoDeElla: r.ultimo_mensaje_de_ella ? new Date(r.ultimo_mensaje_de_ella).toISOString() : null,
  };
}

/** Conversaciones espontáneas (copia local de la bandeja) que no entraron por un comentario. */
export async function conversacionesEspontaneas() {
  const { rows } = await sql`
    SELECT c.igsid, c.usuario, c.actualizado_ig,
      (SELECT texto FROM social_mensajes m WHERE m.igsid = c.igsid ORDER BY ts DESC LIMIT 1) AS ultimo_texto
    FROM social_conversaciones c WHERE NOT EXISTS (SELECT 1 FROM social_personas s WHERE s.igsid = c.igsid)
    ORDER BY c.actualizado_ig DESC NULLS LAST LIMIT 100`;
  return rows.map((r) => ({
    igsid: r.igsid as string, usuario: r.usuario as string | null,
    ultimo: r.actualizado_ig ? new Date(r.actualizado_ig).toISOString() : new Date(0).toISOString(),
    ultimoTexto: r.ultimo_texto as string | null,
  }));
}

/** Mensajes guardados de una persona y cuándo escribió ella por última vez (para la ventana de 24 h). */
export async function mensajesDe(igsid: string) {
  const { rows } = await sql`SELECT id, texto, nuestro, ts, origen, estado FROM social_mensajes WHERE igsid = ${igsid} ORDER BY ts ASC LIMIT 300`;
  const mensajes = rows.map((r) => ({
    id: r.id as string, texto: (r.texto ?? "") as string, nuestro: Boolean(r.nuestro),
    ts: new Date(r.ts).toISOString(), origen: (r.origen ?? (r.nuestro ? "agente" : "persona")) as string, estado: r.estado as string | null,
  }));
  const ultimoDeElla = [...mensajes].reverse().find((m) => !m.nuestro)?.ts ?? null;
  const { rows: s } = await sql`SELECT sincronizado FROM social_conversaciones WHERE igsid = ${igsid}`;
  return { mensajes, ultimoDeElla, sincronizado: s[0]?.sincronizado ? new Date(s[0].sincronizado).toISOString() : null };
}

// ---------- Landings ----------

export interface FilaLanding {
  ruta: string; visitas: number; desdeIg: number; celular: number; scroll: number; completos: number; leads: number; publicaciones: number;
}

export async function listaLandings(): Promise<FilaLanding[]> {
  const { rows } = await sql`
    WITH rutas AS (
      SELECT DISTINCT landing AS ruta FROM social_visitas WHERE inicio > NOW() - INTERVAL '30 days'
      UNION SELECT DISTINCT regexp_replace(landing_url, '^https?://[^/]+', '') FROM social_automatizaciones WHERE landing_url IS NOT NULL
      UNION SELECT '/servinomic/limpiaexpress'
    )
    SELECT r.ruta,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.landing = r.ruta AND v.inicio > NOW() - INTERVAL '30 days') AS visitas,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.landing = r.ruta AND v.codigo IS NOT NULL AND v.inicio > NOW() - INTERVAL '30 days') AS desde_ig,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.landing = r.ruta AND v.dispositivo = 'celular' AND v.inicio > NOW() - INTERVAL '30 days') AS celular,
      (SELECT COALESCE(AVG(max_scroll), 0) FROM social_visitas v WHERE v.landing = r.ruta AND v.inicio > NOW() - INTERVAL '30 days') AS scroll,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.landing = r.ruta AND v.paso_formulario >= 4 AND v.inicio > NOW() - INTERVAL '30 days') AS completos,
      (SELECT COUNT(*) FROM leads l WHERE l.campaign = split_part(r.ruta, '/', 3) AND l.created_at > NOW() - INTERVAL '30 days') AS leads,
      (SELECT COUNT(*) FROM social_automatizaciones a WHERE a.landing_url LIKE '%' || r.ruta) AS publicaciones
    FROM rutas r ORDER BY visitas DESC, r.ruta`;
  return rows.map((r) => ({
    ruta: r.ruta, visitas: Number(r.visitas), desdeIg: Number(r.desde_ig),
    celular: Number(r.visitas) ? Math.round((Number(r.celular) / Number(r.visitas)) * 100) : 0,
    scroll: Math.round(Number(r.scroll) * 100), completos: Number(r.completos), leads: Number(r.leads), publicaciones: Number(r.publicaciones),
  }));
}

/** Clics con posición relativa a su sección, para dibujar el mapa de calor. */
export async function clicsPorPosicion(ruta: string) {
  const { rows } = await sql`
    SELECT c.seccion, c.x_rel, c.y_rel, c.muerto, c.rabia FROM social_clics c JOIN social_visitas v ON v.id = c.visita_id
    WHERE v.landing = ${ruta} AND v.inicio > NOW() - INTERVAL '30 days' AND c.seccion IS NOT NULL AND c.x_rel IS NOT NULL LIMIT 3000`;
  return rows.map((r) => ({ seccion: r.seccion as string, x: Number(r.x_rel), y: Number(r.y_rel), muerto: Boolean(r.muerto), rabia: Boolean(r.rabia) }));
}

// ---------- Automatizaciones (lista) ----------

export async function automatizacionesLista() {
  const [a, sin] = await Promise.all([
    sql`SELECT a.media_id, a.modo, a.sensible, a.landing_url, a.activado_en, a.proxima_revision, a.palabras_clave, a.actualizado,
          p.caption, p.miniatura, p.tipo, p.publicado,
          (SELECT COUNT(*) FROM social_comentarios c WHERE c.media_id = a.media_id AND c.estado <> 'sin_procesar') AS procesados,
          (SELECT COUNT(*) FROM social_personas s WHERE s.media_id = a.media_id AND s.rama = 'negocio') AS leads,
          (SELECT COUNT(*) FROM social_comentarios c WHERE c.media_id = a.media_id AND c.estado IN ('revision','error')) AS revision
        FROM social_automatizaciones a JOIN social_publicaciones p USING (media_id) ORDER BY a.actualizado DESC`,
    sql`SELECT media_id, caption FROM social_publicaciones WHERE media_id NOT IN (SELECT media_id FROM social_automatizaciones)
        ORDER BY publicado DESC NULLS LAST LIMIT 40`,
  ]);
  return {
    filas: a.rows.map((r) => ({
      mediaId: r.media_id as string, titulo: titulo(r.caption), miniatura: r.miniatura as string | null, tipo: r.tipo as string | null,
      modo: r.modo as string, sensible: Boolean(r.sensible), landing: r.landing_url as string | null,
      palabrasClave: (r.palabras_clave ?? []) as string[],
      activadoEn: r.activado_en ? new Date(r.activado_en).toISOString() : null,
      proximaRevision: r.proxima_revision ? new Date(r.proxima_revision).toISOString() : null,
      procesados: Number(r.procesados), leads: Number(r.leads), revision: Number(r.revision),
    })),
    sinAutomatizar: sin.rows.map((r) => ({ mediaId: r.media_id as string, titulo: titulo(r.caption) })),
  };
}

// ---------- Contactos ----------

export async function contactos() {
  const { rows } = await sql`
    SELECT s.igsid, s.usuario, s.codigo, s.rama, s.paso, s.desde, s.etiquetas, s.media_id, p.caption,
      (SELECT COUNT(*) FROM social_visitas v WHERE v.codigo = s.codigo) AS visitas,
      (SELECT COALESCE(MAX(paso_formulario), 0) FROM social_visitas v WHERE v.codigo = s.codigo) AS paso_form,
      l.name AS nombre, l.whatsapp, l.completed AS lead_completo, l.prioridad
    FROM social_personas s LEFT JOIN social_publicaciones p ON p.media_id = s.media_id
    LEFT JOIN LATERAL (SELECT name, whatsapp, completed, prioridad FROM leads WHERE social_codigo = s.codigo ORDER BY created_at DESC LIMIT 1) l ON TRUE
    ORDER BY s.desde DESC LIMIT 500`;
  return rows.map((r) => ({
    igsid: r.igsid as string, usuario: r.usuario as string | null, rama: r.rama as string | null, paso: r.paso as string,
    desde: new Date(r.desde).toISOString(), etiquetas: (r.etiquetas ?? []) as string[], mediaId: r.media_id as string | null,
    publicacion: r.caption ? titulo(r.caption) : null, visitas: Number(r.visitas), pasoFormulario: Number(r.paso_form),
    nombre: r.nombre as string | null, whatsapp: r.whatsapp as string | null, leadCompleto: Boolean(r.lead_completo), prioridad: r.prioridad as string | null,
  }));
}
