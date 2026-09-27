import { sql } from "@/lib/db";
import { TEXTOS_INICIALES } from "./textos";
import type { Automatizacion, Modo, Paso, Textos } from "./tipos";

/** Consultas con nombre del agente. Una sola fuente para ciclos, rutas y páginas. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aAutomatizacion(r: any): Automatizacion {
  return {
    mediaId: r.media_id,
    modo: r.modo as Modo,
    sensible: r.sensible,
    activadoEn: r.activado_en ? new Date(r.activado_en).toISOString() : null,
    landingUrl: r.landing_url,
    palabrasClave: r.palabras_clave ?? [],
    detectarInteres: r.detectar_interes,
    umbral: Number(r.umbral),
    contexto: r.contexto,
    textos: { ...TEXTOS_INICIALES, ...(r.textos as Partial<Textos>) },
  };
}

// ---------- publicaciones ----------

export async function guardarPublicacion(p: {
  id: string; caption?: string; permalink?: string; miniatura?: string; tipo?: string; publicado: string;
  /** false = reel no compartido en el perfil (los reels de prueba vienen así; la API no los marca aparte). */
  enPerfil?: boolean | null;
}) {
  await sql`
    INSERT INTO social_publicaciones (media_id, caption, permalink, miniatura, tipo, publicado, en_perfil, sincronizado)
    VALUES (${p.id}, ${p.caption ?? null}, ${p.permalink ?? null}, ${p.miniatura ?? null}, ${p.tipo ?? null},
            ${p.publicado}, ${p.enPerfil ?? null}, NOW())
    ON CONFLICT (media_id) DO UPDATE SET caption = EXCLUDED.caption, permalink = EXCLUDED.permalink,
      miniatura = EXCLUDED.miniatura, tipo = EXCLUDED.tipo, en_perfil = EXCLUDED.en_perfil, sincronizado = NOW()`;
}

export async function fijarConteoIg(mediaId: string, conteo: number) {
  await sql`UPDATE social_publicaciones SET conteo_ig = ${conteo} WHERE media_id = ${mediaId}`;
}

// ---------- automatizaciones ----------

export async function automatizacion(mediaId: string): Promise<Automatizacion | null> {
  const { rows } = await sql`SELECT * FROM social_automatizaciones WHERE media_id = ${mediaId}`;
  return rows[0] ? aAutomatizacion(rows[0]) : null;
}

/** Las que toca revisar ahora: activas y con la próxima revisión vencida. */
export async function automatizacionesPendientes(): Promise<(Automatizacion & { conteoVisto: number })[]> {
  const { rows } = await sql`
    SELECT a.*, p.comentarios_vistos FROM social_automatizaciones a
    JOIN social_publicaciones p USING (media_id)
    WHERE a.modo <> 'apagado' AND (a.proxima_revision IS NULL OR a.proxima_revision <= NOW())`;
  return rows.map((r) => ({ ...aAutomatizacion(r), conteoVisto: r.comentarios_vistos ?? 0 }));
}

export async function guardarAutomatizacion(a: Omit<Automatizacion, "activadoEn"> & { activar: boolean }) {
  await sql`
    INSERT INTO social_automatizaciones (media_id, modo, sensible, landing_url, palabras_clave,
      detectar_interes, umbral, contexto, textos, activado_en, proxima_revision, actualizado)
    VALUES (${a.mediaId}, ${a.modo}, ${a.sensible}, ${a.landingUrl}, ${JSON.stringify(a.palabrasClave)},
      ${a.detectarInteres}, ${a.umbral}, ${a.contexto}, ${JSON.stringify(a.textos)},
      ${a.activar ? new Date().toISOString() : null}, NOW(), NOW())
    ON CONFLICT (media_id) DO UPDATE SET modo = EXCLUDED.modo, sensible = EXCLUDED.sensible,
      landing_url = EXCLUDED.landing_url, palabras_clave = EXCLUDED.palabras_clave,
      detectar_interes = EXCLUDED.detectar_interes, umbral = EXCLUDED.umbral,
      contexto = EXCLUDED.contexto, textos = EXCLUDED.textos, actualizado = NOW(),
      activado_en = COALESCE(social_automatizaciones.activado_en, EXCLUDED.activado_en),
      proxima_revision = NOW()`;
}

export async function programarRevision(mediaId: string, enMs: number | null, conteoVisto: number) {
  if (enMs === null) {
    await sql`UPDATE social_automatizaciones SET modo = 'apagado' WHERE media_id = ${mediaId}`;
  } else {
    await sql`UPDATE social_automatizaciones SET proxima_revision = NOW() + ${`${Math.round(enMs / 1000)} seconds`}::interval
      WHERE media_id = ${mediaId}`;
  }
  await sql`UPDATE social_publicaciones SET comentarios_vistos = ${conteoVisto} WHERE media_id = ${mediaId}`;
}

// ---------- comentarios ----------

export async function idsComentarios(mediaId: string): Promise<Set<string>> {
  const { rows } = await sql`SELECT id FROM social_comentarios WHERE media_id = ${mediaId} AND estado <> 'sin_procesar'`;
  return new Set(rows.map((r) => r.id));
}

/** Primer paso de la escritura en dos tiempos: nada sale a Instagram sin esta fila. */
export async function reservarComentario(c: {
  id: string; mediaId: string; usuario: string | null; igsid: string | null; texto: string; ts: string;
  tipo: string; confianza: number; accion: string; respuesta: string | null; meGusta: number | null;
}): Promise<boolean> {
  const { rowCount } = await sql`
    INSERT INTO social_comentarios (id, media_id, usuario, igsid, texto, ts, tipo, confianza, accion,
      respuesta, estado, me_gusta)
    VALUES (${c.id}, ${c.mediaId}, ${c.usuario}, ${c.igsid}, ${c.texto}, ${c.ts}, ${c.tipo}, ${c.confianza},
      ${c.accion}, ${c.respuesta}, 'reservado', ${c.meGusta})
    ON CONFLICT (id) DO UPDATE SET tipo = EXCLUDED.tipo, confianza = EXCLUDED.confianza, accion = EXCLUDED.accion,
      respuesta = EXCLUDED.respuesta, estado = 'reservado', procesado_en = NOW()
    WHERE social_comentarios.estado = 'sin_procesar'`;
  return (rowCount ?? 0) > 0;
}

export async function confirmarComentario(id: string, estado: string, error?: string) {
  await sql`UPDATE social_comentarios SET estado = ${estado}, error = ${error ?? null}, procesado_en = NOW()
    WHERE id = ${id}`;
}

// ---------- personas y mensajes ----------

export interface Persona {
  igsid: string; usuario: string | null; codigo: string; mediaId: string | null; commentId: string | null;
  paso: Paso; rama: string | null; desde: string; ultimoMensajeDeElla: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aPersona(r: any): Persona {
  return {
    igsid: r.igsid, usuario: r.usuario, codigo: r.codigo, mediaId: r.media_id, commentId: r.comment_id,
    paso: r.paso, rama: r.rama, desde: new Date(r.desde).toISOString(),
    ultimoMensajeDeElla: r.ultimo_mensaje_de_ella ? new Date(r.ultimo_mensaje_de_ella).toISOString() : null,
  };
}

export async function persona(igsid: string): Promise<Persona | null> {
  const { rows } = await sql`SELECT * FROM social_personas WHERE igsid = ${igsid}`;
  return rows[0] ? aPersona(rows[0]) : null;
}

/** ¿Esta persona ya recibió el mensaje por ESTA publicación? */
export async function entroPorPublicacion(igsid: string, mediaId: string): Promise<boolean> {
  const { rows } = await sql`SELECT 1 FROM social_entradas WHERE igsid = ${igsid} AND media_id = ${mediaId}`;
  return rows.length > 0;
}

/**
 * Registra la entrada al flujo por una publicación y deja a la persona
 * esperando el botón. Si ya existía (vino de otro video), se le apunta a la
 * publicación nueva conservando su código, que es lo que liga sus visitas a la
 * landing.
 */
export async function registrarEntrada(p: {
  igsid: string; usuario: string | null; codigo: string; mediaId: string; commentId: string;
}) {
  await sql`INSERT INTO social_entradas (igsid, media_id, comment_id) VALUES (${p.igsid}, ${p.mediaId}, ${p.commentId})
    ON CONFLICT (igsid, media_id) DO NOTHING`;
  await sql`
    INSERT INTO social_personas (igsid, usuario, codigo, media_id, comment_id, paso, desde)
    VALUES (${p.igsid}, ${p.usuario}, ${p.codigo}, ${p.mediaId}, ${p.commentId}, 'esperando_boton', NOW())
    ON CONFLICT (igsid) DO UPDATE SET usuario = COALESCE(EXCLUDED.usuario, social_personas.usuario),
      media_id = EXCLUDED.media_id, comment_id = EXCLUDED.comment_id, paso = 'esperando_boton',
      rama = NULL, desde = NOW(), actualizado = NOW()`;
}

export async function crearPersona(p: Omit<Persona, "rama" | "ultimoMensajeDeElla">) {
  await sql`
    INSERT INTO social_personas (igsid, usuario, codigo, media_id, comment_id, paso, desde)
    VALUES (${p.igsid}, ${p.usuario}, ${p.codigo}, ${p.mediaId}, ${p.commentId}, ${p.paso}, ${p.desde})
    ON CONFLICT (igsid) DO NOTHING`;
}

export async function actualizarPersona(igsid: string, paso: Paso, rama: string | null, ultimoDeElla?: string) {
  await sql`UPDATE social_personas SET paso = ${paso}, rama = COALESCE(${rama}, rama),
    ultimo_mensaje_de_ella = COALESCE(${ultimoDeElla ?? null}, ultimo_mensaje_de_ella), actualizado = NOW()
    WHERE igsid = ${igsid}`;
}

export async function personasEnFlujo(): Promise<Persona[]> {
  const { rows } = await sql`SELECT * FROM social_personas
    WHERE paso IN ('esperando_boton','esperando_texto','asesoria_enviada','enviado_aliado')`;
  return rows.map(aPersona);
}

export async function idsMensajes(igsid: string): Promise<Set<string>> {
  const { rows } = await sql`SELECT id FROM social_mensajes WHERE igsid = ${igsid}`;
  return new Set(rows.map((r) => r.id));
}

export async function guardarMensaje(m: {
  id: string; igsid: string; texto: string | null; nuestro: boolean; ts: string;
  origen: "agente" | "victor" | "persona"; accion?: string | null; estado?: string | null; borrador?: string | null;
}) {
  await sql`
    INSERT INTO social_mensajes (id, igsid, texto, nuestro, ts, origen, accion, estado, borrador)
    VALUES (${m.id}, ${m.igsid}, ${m.texto}, ${m.nuestro}, ${m.ts}, ${m.origen}, ${m.accion ?? null},
      ${m.estado ?? null}, ${m.borrador ?? null})
    ON CONFLICT (id) DO UPDATE SET accion = COALESCE(EXCLUDED.accion, social_mensajes.accion),
      estado = COALESCE(EXCLUDED.estado, social_mensajes.estado),
      borrador = COALESCE(EXCLUDED.borrador, social_mensajes.borrador)`;
}
