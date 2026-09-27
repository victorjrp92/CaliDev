import { sql } from "@/lib/db";

/**
 * Esquema y consultas del agente de Instagram (tablas social_*).
 *
 * Se asegura una vez por instancia del servidor, igual que las columnas de
 * api/leads/delegar: CREATE … IF NOT EXISTS no toca nada que ya exista y
 * repetirlo no hace nada. Producción, vistas previas y local comparten la
 * misma base, así que aquí nunca se borra ni se renombra.
 */
let esquema: Promise<void> | null = null;

export function asegurarEsquema(): Promise<void> {
  esquema ??= crear().catch((err) => {
    esquema = null; // que el siguiente intento lo repita
    throw err;
  });
  return esquema;
}

async function crear() {
  await sql`CREATE TABLE IF NOT EXISTS social_ajustes (clave TEXT PRIMARY KEY, valor TEXT)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_publicaciones (
      media_id TEXT PRIMARY KEY, caption TEXT, permalink TEXT, miniatura TEXT,
      tipo TEXT, publicado TIMESTAMPTZ, comentarios_vistos INT DEFAULT 0,
      conteo_ig INT DEFAULT 0, sincronizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_automatizaciones (
      media_id TEXT PRIMARY KEY REFERENCES social_publicaciones(media_id),
      modo TEXT NOT NULL DEFAULT 'apagado', sensible BOOLEAN NOT NULL DEFAULT FALSE,
      activado_en TIMESTAMPTZ, proxima_revision TIMESTAMPTZ,
      landing_url TEXT, palabras_clave JSONB NOT NULL DEFAULT '[]',
      detectar_interes BOOLEAN NOT NULL DEFAULT TRUE, umbral REAL NOT NULL DEFAULT 0.7,
      contexto TEXT, textos JSONB NOT NULL, actualizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_comentarios (
      id TEXT PRIMARY KEY, media_id TEXT NOT NULL, usuario TEXT, igsid TEXT, texto TEXT,
      ts TIMESTAMPTZ, tipo TEXT, confianza REAL, accion TEXT, respuesta TEXT,
      estado TEXT NOT NULL, error TEXT, tipo_corregido TEXT, me_gusta INT,
      procesado_en TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS social_comentarios_media ON social_comentarios (media_id, ts)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_personas (
      igsid TEXT PRIMARY KEY, usuario TEXT, codigo TEXT UNIQUE NOT NULL,
      media_id TEXT, comment_id TEXT, paso TEXT NOT NULL, rama TEXT,
      desde TIMESTAMPTZ NOT NULL, ultimo_mensaje_de_ella TIMESTAMPTZ,
      etiquetas JSONB NOT NULL DEFAULT '[]', nota TEXT, actualizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_mensajes (
      id TEXT PRIMARY KEY, igsid TEXT NOT NULL, texto TEXT, nuestro BOOLEAN NOT NULL,
      ts TIMESTAMPTZ NOT NULL, origen TEXT, accion TEXT, estado TEXT, borrador TEXT)`;
  await sql`CREATE INDEX IF NOT EXISTS social_mensajes_persona ON social_mensajes (igsid, ts)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_metricas (
      media_id TEXT NOT NULL, medido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      vistas INT, alcance INT, skip_rate REAL, tiempo_promedio_ms INT,
      guardados INT, compartidos INT, me_gusta INT, comentarios INT)`;
  await sql`CREATE INDEX IF NOT EXISTS social_metricas_media ON social_metricas (media_id, medido_en)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_video (
      media_id TEXT PRIMARY KEY, duracion_s REAL, transcripcion JSONB, escenas JSONB,
      gancho JSONB, curva JSONB, caidas JSONB, analizado_en TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_visitas (
      id TEXT PRIMARY KEY, codigo TEXT, landing TEXT NOT NULL, inicio TIMESTAMPTZ DEFAULT NOW(),
      fin TIMESTAMPTZ, dispositivo TEXT, pais TEXT, max_scroll REAL DEFAULT 0,
      secciones JSONB NOT NULL DEFAULT '[]', paso_formulario INT DEFAULT 0)`;
  await sql`CREATE INDEX IF NOT EXISTS social_visitas_codigo ON social_visitas (codigo)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_clics (
      visita_id TEXT NOT NULL, selector TEXT, seccion TEXT, x_rel REAL, y_rel REAL,
      muerto BOOLEAN DEFAULT FALSE, rabia BOOLEAN DEFAULT FALSE, ts TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS social_clics_visita ON social_clics (visita_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_eventos (
      ts TIMESTAMPTZ DEFAULT NOW(), nivel TEXT NOT NULL, texto TEXT NOT NULL, media_id TEXT)`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_consumo (
      mes TEXT NOT NULL, servicio TEXT NOT NULL, llamadas INT NOT NULL DEFAULT 0,
      PRIMARY KEY (mes, servicio))`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_entradas (
      igsid TEXT NOT NULL, media_id TEXT NOT NULL, comment_id TEXT, desde TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (igsid, media_id))`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_conversaciones (
      igsid TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, usuario TEXT,
      actualizado_ig TIMESTAMPTZ, mensajes_hasta TIMESTAMPTZ, sincronizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`ALTER TABLE social_publicaciones ADD COLUMN IF NOT EXISTS en_perfil BOOLEAN`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_codigo TEXT`;
  await sql`
    INSERT INTO social_ajustes (clave, valor) VALUES ('pausado','0'), ('simulacion','1'),
      ('fallos_seguidos','0') ON CONFLICT (clave) DO NOTHING`;
}

// ---------- ajustes, eventos, candado, consumo ----------

export async function ajuste(clave: string): Promise<string | null> {
  const { rows } = await sql`SELECT valor FROM social_ajustes WHERE clave = ${clave}`;
  return rows[0]?.valor ?? null;
}

export async function fijarAjuste(clave: string, valor: string) {
  await sql`INSERT INTO social_ajustes (clave, valor) VALUES (${clave}, ${valor})
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`;
}

export async function evento(texto: string, nivel: "info" | "alerta" | "error" = "info", mediaId?: string) {
  await sql`INSERT INTO social_eventos (nivel, texto, media_id) VALUES (${nivel}, ${texto.slice(0, 500)}, ${mediaId ?? null})`;
}

/**
 * Candado con caducidad: si una ejecución muere a mitad (tope de tiempo de
 * Vercel), el candado se libera solo a los `segundos`, en vez de bloquear para
 * siempre.
 */
export async function tomarCandado(segundos: number): Promise<boolean> {
  await sql`INSERT INTO social_ajustes (clave, valor) VALUES ('candado', '0') ON CONFLICT DO NOTHING`;
  const hasta = Date.now() + segundos * 1000;
  const { rowCount } = await sql`
    UPDATE social_ajustes SET valor = ${String(hasta)}
    WHERE clave = 'candado' AND valor::bigint < ${Date.now()}`;
  return (rowCount ?? 0) > 0;
}

export async function soltarCandado() {
  await sql`UPDATE social_ajustes SET valor = '0' WHERE clave = 'candado'`;
}

export async function sumarConsumo(servicio: string, n = 1) {
  const mes = new Date().toISOString().slice(0, 7);
  await sql`INSERT INTO social_consumo (mes, servicio, llamadas) VALUES (${mes}, ${servicio}, ${n})
    ON CONFLICT (mes, servicio) DO UPDATE SET llamadas = social_consumo.llamadas + ${n}`;
}
