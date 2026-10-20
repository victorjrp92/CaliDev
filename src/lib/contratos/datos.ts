import { createHash, randomBytes, randomInt } from "node:crypto";
import { sql } from "@/lib/db";

/**
 * Contratos con firma electrónica propia: calidev.dev/contratos/<token>.
 *
 * Un contrato es un texto HTML fijo y las personas que lo firman. Cada
 * firmante tiene su propio enlace (`token`): con él ve el contrato, pone sus
 * datos y firma; nada más.
 *
 * `huella` es el SHA-256 del HTML tal como se guardó. Sale en la constancia de
 * firma: si alguien cambiara una coma del contrato después, la huella ya no
 * coincidiría. El texto no se edita nunca; un contrato corregido es otro
 * contrato.
 *
 * La firma vale como firma electrónica (Ley 527 de 1999, Decreto 2364 de 2012)
 * porque junta tres cosas: identifica a quien firma (sus datos y un código de
 * un solo uso enviado a su correo), queda ligada a ese texto exacto (la huella)
 * y deja rastro de cuándo y desde dónde (fecha, IP y navegador).
 *
 * El código de verificación nunca se guarda en claro: solo su hash, con un
 * plazo de 15 minutos y un tope de 5 intentos.
 */

export type Contrato = {
  id: number;
  titulo: string;
  html: string;
  huella: string;
  /** Los datos de la plantilla con que se armó (JSON), para usarlo de base en otro. */
  datos: string | null;
  created_at: string;
};

export type Firmante = {
  id: number;
  contrato_id: number;
  orden: number;
  rol: string;
  etiqueta: string;
  token: string;
  nombre: string | null;
  tipo_documento: string | null;
  documento: string | null;
  correo: string | null;
  celular: string | null;
  empresa: string | null;
  firma: string | null;
  ip: string | null;
  navegador: string | null;
  codigo_hash: string | null;
  codigo_correo: string | null;
  codigo_enviado_at: string | null;
  codigo_intentos: number;
  abierto_at: string | null;
  firmado_at: string | null;
};

let tabla: Promise<unknown> | null = null;
function asegurarTabla() {
  tabla ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS contratos (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        html TEXT NOT NULL,
        huella TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS datos TEXT`;
    await sql`
      CREATE TABLE IF NOT EXISTS contrato_firmantes (
        id SERIAL PRIMARY KEY,
        contrato_id INT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
        orden INT NOT NULL DEFAULT 0,
        rol TEXT NOT NULL,
        etiqueta TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        nombre TEXT,
        tipo_documento TEXT,
        documento TEXT,
        correo TEXT,
        celular TEXT,
        empresa TEXT,
        firma TEXT,
        ip TEXT,
        navegador TEXT,
        codigo_hash TEXT,
        codigo_correo TEXT,
        codigo_enviado_at TIMESTAMPTZ,
        codigo_intentos INT NOT NULL DEFAULT 0,
        abierto_at TIMESTAMPTZ,
        firmado_at TIMESTAMPTZ
      )
    `;
  })().catch((err) => {
    tabla = null;
    throw err;
  });
  return tabla;
}

export function huellaDe(html: string): string {
  return createHash("sha256").update(html, "utf8").digest("hex");
}

function hashCodigo(token: string, codigo: string): string {
  return createHash("sha256").update(`${token}:${codigo}`, "utf8").digest("hex");
}

export async function crearContrato(
  titulo: string,
  html: string,
  firmantes: { rol: string; etiqueta: string }[],
  datos: string | null = null
): Promise<{ contrato: Contrato; firmantes: Firmante[] }> {
  await asegurarTabla();
  const r = await sql<Contrato>`
    INSERT INTO contratos (titulo, html, huella, datos) VALUES (${titulo}, ${html}, ${huellaDe(html)}, ${datos}) RETURNING *
  `;
  const contrato = r.rows[0];
  const creados: Firmante[] = [];
  for (const [i, f] of firmantes.entries()) {
    const token = randomBytes(16).toString("hex");
    const fr = await sql<Firmante>`
      INSERT INTO contrato_firmantes (contrato_id, orden, rol, etiqueta, token)
      VALUES (${contrato.id}, ${i}, ${f.rol}, ${f.etiqueta}, ${token})
      RETURNING *
    `;
    creados.push(fr.rows[0]);
  }
  return { contrato, firmantes: creados };
}

export async function firmantePorToken(token: string): Promise<Firmante | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  await asegurarTabla();
  const r = await sql<Firmante>`SELECT * FROM contrato_firmantes WHERE token = ${token}`;
  return r.rows[0] ?? null;
}

export async function contratoPorId(id: number): Promise<Contrato | null> {
  await asegurarTabla();
  const r = await sql<Contrato>`SELECT * FROM contratos WHERE id = ${id}`;
  return r.rows[0] ?? null;
}

export async function firmantesDe(contratoId: number): Promise<Firmante[]> {
  await asegurarTabla();
  const r = await sql<Firmante>`SELECT * FROM contrato_firmantes WHERE contrato_id = ${contratoId} ORDER BY orden`;
  return r.rows;
}

export async function todosLosContratos(): Promise<(Contrato & { firmantes: Firmante[] })[]> {
  await asegurarTabla();
  const c = await sql<Contrato>`SELECT * FROM contratos ORDER BY created_at DESC`;
  const f = await sql<Firmante>`SELECT * FROM contrato_firmantes ORDER BY contrato_id, orden`;
  return c.rows.map((x) => ({ ...x, firmantes: f.rows.filter((y) => y.contrato_id === x.id) }));
}

/** Primera vez que la persona abre su enlace: queda en la constancia. */
export async function marcarAbierto(id: number): Promise<void> {
  await sql`UPDATE contrato_firmantes SET abierto_at = NOW() WHERE id = ${id} AND abierto_at IS NULL`;
}

export type ResultadoCodigo = { ok: true; codigo: string } | { ok: false; motivo: "firmado" | "espera" };

/**
 * Genera un código nuevo de 6 dígitos para `correo`. Uno por minuto como
 * máximo: evita que el botón se convierta en una forma de llenarle el buzón a
 * alguien. Cada código nuevo reinicia los intentos y anula el anterior.
 */
export async function nuevoCodigo(f: Firmante, correo: string): Promise<ResultadoCodigo> {
  if (f.firmado_at) return { ok: false, motivo: "firmado" };
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const r = await sql`
    UPDATE contrato_firmantes SET
      codigo_hash = ${hashCodigo(f.token, codigo)},
      codigo_correo = ${correo},
      codigo_enviado_at = NOW(),
      codigo_intentos = 0
    WHERE id = ${f.id} AND firmado_at IS NULL
      AND (codigo_enviado_at IS NULL OR codigo_enviado_at < NOW() - INTERVAL '60 seconds')
  `;
  if ((r.rowCount ?? 0) === 0) return { ok: false, motivo: "espera" };
  return { ok: true, codigo };
}

export type DatosFirma = {
  nombre: string;
  tipoDocumento: string;
  documento: string;
  correo: string;
  celular: string;
  empresa: string;
  firma: string;
  ip: string;
  navegador: string;
};

export type ResultadoFirma =
  | { ok: true; firmante: Firmante }
  | { ok: false; motivo: "firmado" | "sin-codigo" | "vencido" | "intentos" | "incorrecto" | "otro-correo" };

/**
 * Verifica el código y firma en la misma operación. El código vale 15 minutos
 * y para el correo al que se envió: si la persona cambia el correo después de
 * pedirlo, tiene que pedir otro.
 */
export async function firmar(f: Firmante, codigo: string, d: DatosFirma): Promise<ResultadoFirma> {
  if (f.firmado_at) return { ok: false, motivo: "firmado" };
  if (!f.codigo_hash || !f.codigo_enviado_at) return { ok: false, motivo: "sin-codigo" };
  if (f.codigo_correo !== d.correo) return { ok: false, motivo: "otro-correo" };
  if (Date.now() - new Date(f.codigo_enviado_at).getTime() > 15 * 60 * 1000) return { ok: false, motivo: "vencido" };
  if (f.codigo_intentos >= 5) return { ok: false, motivo: "intentos" };

  if (hashCodigo(f.token, codigo) !== f.codigo_hash) {
    await sql`UPDATE contrato_firmantes SET codigo_intentos = codigo_intentos + 1 WHERE id = ${f.id}`;
    return { ok: false, motivo: f.codigo_intentos + 1 >= 5 ? "intentos" : "incorrecto" };
  }

  const r = await sql<Firmante>`
    UPDATE contrato_firmantes SET
      nombre = ${d.nombre},
      tipo_documento = ${d.tipoDocumento},
      documento = ${d.documento},
      correo = ${d.correo},
      celular = ${d.celular || null},
      empresa = ${d.empresa || null},
      firma = ${d.firma},
      ip = ${d.ip},
      navegador = ${d.navegador},
      codigo_hash = NULL,
      firmado_at = NOW()
    WHERE id = ${f.id} AND firmado_at IS NULL
    RETURNING *
  `;
  if (!r.rows[0]) return { ok: false, motivo: "firmado" };
  return { ok: true, firmante: r.rows[0] };
}

/** Solo contratos sin ninguna firma: los firmados son el registro y no se tocan. */
export async function borrarContratoSinFirmas(id: number): Promise<boolean> {
  await asegurarTabla();
  const r = await sql`
    DELETE FROM contratos WHERE id = ${id}
      AND NOT EXISTS (SELECT 1 FROM contrato_firmantes WHERE contrato_id = ${id} AND firmado_at IS NOT NULL)
  `;
  return (r.rowCount ?? 0) > 0;
}
