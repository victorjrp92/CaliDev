import { sql } from "@/lib/db";
import { type Actor, ErrorCrm } from "./actor";
import { auditar } from "./auditoria";

/**
 * Contactos del CRM (spec §3, pestaña 4): una persona, opcionalmente de una
 * empresa. Las tablas viejas (leads, citas, social_personas, contactos) no se
 * copian: se enlazan desde `crm_personas_ref` y la línea de tiempo las lee.
 */
export type Persona = {
  id: number;
  nombre: string;
  correo: string | null;
  whatsapp: string | null;
  igsid: string | null;
  usuario_ig: string | null;
  origen: string | null;
  notas: string | null;
  empresa_id: number | null;
  empresa: string | null;
  created_at: string;
  updated_at: string;
};

export type DatosPersona = {
  nombre?: string;
  correo?: string | null;
  whatsapp?: string | null;
  igsid?: string | null;
  usuario_ig?: string | null;
  origen?: string | null;
  notas?: string | null;
  empresa?: string | null;
};

const CAMPOS = ["nombre", "correo", "whatsapp", "igsid", "usuario_ig", "origen", "notas"] as const;

export const normalizarCorreo = (c: string | null | undefined) => (c?.trim() ? c.trim().toLowerCase() : null);
export const normalizarWhatsapp = (w: string | null | undefined) => {
  const d = (w ?? "").replace(/\D/g, "");
  return d ? d : null;
};

function texto(v: unknown, campo: string, max = 500): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") throw new ErrorCrm(400, "campo_invalido", `${campo} debe ser texto.`, campo);
  const t = v.trim();
  if (t.length > max) throw new ErrorCrm(400, "campo_invalido", `${campo} admite hasta ${max} caracteres.`, campo);
  return t || null;
}

/** Empresa por nombre (sin distinguir mayúsculas); la crea si no existe. */
export async function empresaPorNombre(actor: Actor | null, nombre: string): Promise<number> {
  const limpio = nombre.trim();
  const previa = await sql<{ id: number }>`SELECT id FROM crm_empresas WHERE lower(nombre) = lower(${limpio})`;
  if (previa.rows[0]) return previa.rows[0].id;
  const r = await sql<{ id: number }>`
    INSERT INTO crm_empresas (nombre) VALUES (${limpio})
    ON CONFLICT ((lower(nombre))) DO UPDATE SET nombre = crm_empresas.nombre RETURNING id`;
  await auditar(actor, "crear", "empresa", r.rows[0].id, null, { nombre: limpio });
  return r.rows[0].id;
}

export async function personaPorId(id: number): Promise<Persona | null> {
  const r = await sql<Persona>`
    SELECT p.*, e.nombre AS empresa FROM crm_personas p LEFT JOIN crm_empresas e ON e.id = p.empresa_id
    WHERE p.id = ${id} AND p.fusionada_en IS NULL`;
  return r.rows[0] ?? null;
}

/** Busca por nombre, correo, WhatsApp, usuario de IG o empresa. Sin texto, las más recientes. */
export async function buscarPersonas(q: string | null, limite = 50): Promise<Persona[]> {
  const lim = Math.min(Math.max(limite, 1), 200);
  const t = q?.trim() ?? "";
  const patron = `%${t.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const digitos = t.replace(/\D/g, "");
  const r = await sql<Persona>`
    SELECT p.*, e.nombre AS empresa FROM crm_personas p LEFT JOIN crm_empresas e ON e.id = p.empresa_id
    WHERE p.fusionada_en IS NULL AND (
      ${t} = '' OR p.nombre ILIKE ${patron} OR p.correo ILIKE ${patron} OR p.usuario_ig ILIKE ${patron}
      OR e.nombre ILIKE ${patron} OR (${digitos} <> '' AND length(${digitos}) >= 6 AND p.whatsapp LIKE ${`%${digitos}%`}))
    ORDER BY p.updated_at DESC, p.id DESC LIMIT ${lim}`;
  return r.rows;
}

function limpiarDatos(d: DatosPersona, parcial: boolean): Record<string, string | null> {
  const fuera: Record<string, string | null> = {};
  for (const c of CAMPOS) {
    if (parcial && !(c in d)) continue;
    fuera[c] = texto(d[c], c, c === "notas" ? 5000 : 300);
  }
  if ("correo" in fuera) fuera.correo = normalizarCorreo(fuera.correo);
  if ("whatsapp" in fuera) fuera.whatsapp = normalizarWhatsapp(fuera.whatsapp);
  if (fuera.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fuera.correo)) {
    throw new ErrorCrm(400, "campo_invalido", "El correo no parece válido.", "correo");
  }
  if (!parcial && !fuera.nombre) throw new ErrorCrm(400, "campo_requerido", "La persona necesita un nombre.", "nombre");
  if (parcial && "nombre" in fuera && !fuera.nombre) throw new ErrorCrm(400, "campo_requerido", "El nombre no puede quedar vacío.", "nombre");
  return fuera;
}

export async function crearPersona(actor: Actor | null, d: DatosPersona): Promise<Persona> {
  const f = limpiarDatos(d, false);
  const empresa = texto(d.empresa, "empresa", 200);
  const empresaId = empresa ? await empresaPorNombre(actor, empresa) : null;
  const r = await sql<{ id: number }>`
    INSERT INTO crm_personas (empresa_id, nombre, correo, whatsapp, igsid, usuario_ig, origen, notas)
    VALUES (${empresaId}, ${f.nombre}, ${f.correo}, ${f.whatsapp}, ${f.igsid}, ${f.usuario_ig}, ${f.origen}, ${f.notas})
    RETURNING id`;
  const p = (await personaPorId(r.rows[0].id))!;
  await auditar(actor, "crear", "persona", p.id, null, p);
  return p;
}

export async function editarPersona(actor: Actor, id: number, d: DatosPersona): Promise<Persona> {
  const antes = await personaPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay persona ${id}.`);
  const f = limpiarDatos(d, true);
  const v = (c: (typeof CAMPOS)[number]) => (c in f ? f[c] : antes[c]);
  let empresaId = antes.empresa_id;
  if ("empresa" in d) {
    const e = texto(d.empresa, "empresa", 200);
    empresaId = e ? await empresaPorNombre(actor, e) : null;
  }
  await sql`
    UPDATE crm_personas SET nombre = ${v("nombre")}, correo = ${v("correo")}, whatsapp = ${v("whatsapp")},
      igsid = ${v("igsid")}, usuario_ig = ${v("usuario_ig")}, origen = ${v("origen")}, notas = ${v("notas")},
      empresa_id = ${empresaId}, updated_at = NOW()
    WHERE id = ${id}`;
  const despues = (await personaPorId(id))!;
  await auditar(actor, "editar", "persona", id, antes, despues);
  return despues;
}

/** Enlaza una fila de una tabla vieja con la persona. Devuelve false si ya estaba enlazada (a esta u otra). */
export async function enlazar(personaId: number, tabla: string, refId: string | number): Promise<boolean> {
  const r = await sql`
    INSERT INTO crm_personas_ref (persona_id, tabla, ref_id) VALUES (${personaId}, ${tabla}, ${String(refId)})
    ON CONFLICT DO NOTHING RETURNING persona_id`;
  return r.rows.length > 0;
}

export async function personaPorRef(tabla: string, refId: string | number): Promise<number | null> {
  const r = await sql<{ persona_id: number }>`SELECT persona_id FROM crm_personas_ref WHERE tabla = ${tabla} AND ref_id = ${String(refId)}`;
  return r.rows[0]?.persona_id ?? null;
}

export type Hito = { at: string; tipo: string; titulo: string; detalle: string | null; entidad: string; entidad_id: string };

/**
 * Todo lo que pasó con una persona, lo más nuevo primero: notas, cambios de
 * etapa de sus oportunidades, citas y mensajes de Instagram. Las tablas viejas
 * se leen en vivo; si una todavía no existe en esta base se omite.
 */
export async function lineaDeTiempo(id: number, limite = 100): Promise<Hito[]> {
  const p = await personaPorId(id);
  if (!p) throw new ErrorCrm(404, "no_existe", `No hay persona ${id}.`);
  const hitos: Hito[] = [];

  const notas = await sql<{ id: number; tipo: string; cuerpo: string; created_at: string; autor: string | null }>`
    SELECT n.id, n.tipo, n.cuerpo, n.created_at, u.nombre AS autor FROM crm_notas n LEFT JOIN crm_usuarios u ON u.id = n.autor_id
    WHERE (n.entidad = 'persona' AND n.entidad_id = ${String(id)})
       OR (n.entidad = 'oportunidad' AND n.entidad_id IN (SELECT id::text FROM crm_oportunidades WHERE persona_id = ${id}))`;
  for (const n of notas.rows) {
    hitos.push({ at: n.created_at, tipo: n.tipo, titulo: n.tipo === "nota" ? `Nota de ${n.autor ?? "sistema"}` : n.tipo === "brief" ? "Brief" : "Resumen de llamada", detalle: n.cuerpo, entidad: "nota", entidad_id: String(n.id) });
  }

  const etapas = await sql<{ oportunidad_id: number; titulo: string; de: string | null; a: string; at: string; quien: string | null }>`
    SELECT h.oportunidad_id, o.titulo, h.de, h.a, h.at, u.nombre AS quien FROM crm_etapas_historial h
    JOIN crm_oportunidades o ON o.id = h.oportunidad_id LEFT JOIN crm_usuarios u ON u.id = h.usuario_id
    WHERE o.persona_id = ${id}`;
  for (const e of etapas.rows) {
    hitos.push({ at: e.at, tipo: "etapa", titulo: `${e.titulo}: ${e.de ?? "nueva"} → ${e.a}`, detalle: e.quien ? `por ${e.quien}` : "automático", entidad: "oportunidad", entidad_id: String(e.oportunidad_id) });
  }

  const refs = await sql<{ tabla: string; ref_id: string }>`SELECT tabla, ref_id FROM crm_personas_ref WHERE persona_id = ${id}`;
  const de = (t: string) => refs.rows.filter((r) => r.tabla === t).map((r) => r.ref_id);

  const citas = de("citas").map(Number).filter(Number.isFinite);
  if (citas.length) {
    const r = await opcional("citas", () => sql<{ id: number; tipo: string | null; inicio: string | null; created_at: string }>`
      SELECT id, tipo, inicio, created_at FROM citas WHERE id = ANY(${citas})`);
    for (const c of r) {
      hitos.push({ at: c.created_at, tipo: "cita", titulo: `Invitación a ${c.tipo === "segunda" ? "2.ª" : c.tipo === "sesion" ? "sesión" : "1.ª"} cita`, detalle: c.inicio ? `Reservada para ${c.inicio}` : "Sin hora elegida", entidad: "cita", entidad_id: String(c.id) });
    }
  }
  const leads = de("leads").map(Number).filter(Number.isFinite);
  if (leads.length) {
    const r = await opcional("leads", () => sql<{ id: number; created_at: string; campaign: string }>`SELECT id, created_at, campaign FROM leads WHERE id = ANY(${leads})`);
    for (const l of r) hitos.push({ at: l.created_at, tipo: "formulario", titulo: "Llenó el formulario de la landing", detalle: l.campaign, entidad: "lead", entidad_id: String(l.id) });
  }
  const contactos = de("contactos").map(Number).filter(Number.isFinite);
  if (contactos.length) {
    const r = await opcional("contactos", () => sql<{ id: number; created_at: string; mensaje: string }>`SELECT id, created_at, mensaje FROM contactos WHERE id = ANY(${contactos})`);
    for (const c of r) hitos.push({ at: c.created_at, tipo: "contacto", titulo: "Escribió por el formulario de contacto", detalle: c.mensaje, entidad: "contacto", entidad_id: String(c.id) });
  }
  const firmantes = de("contrato_firmantes").map(Number).filter(Number.isFinite);
  if (firmantes.length) {
    const r = await opcional("contrato_firmantes", () => sql<{ id: number; contrato_id: number; titulo: string; creado: string; abierto_at: string | null; firmado_at: string | null }>`
      SELECT f.id, f.contrato_id, c.titulo, c.created_at AS creado, f.abierto_at, f.firmado_at
      FROM contrato_firmantes f JOIN contratos c ON c.id = f.contrato_id WHERE f.id = ANY(${firmantes})`);
    for (const f of r) {
      const ent = { entidad: "contrato", entidad_id: String(f.contrato_id) };
      hitos.push({ at: f.creado, tipo: "contrato", titulo: "Contrato creado", detalle: f.titulo, ...ent });
      if (f.abierto_at) hitos.push({ at: f.abierto_at, tipo: "contrato", titulo: "Abrió el contrato", detalle: f.titulo, ...ent });
      if (f.firmado_at) hitos.push({ at: f.firmado_at, tipo: "contrato", titulo: "Firmó el contrato", detalle: f.titulo, ...ent });
    }
    const envios = await sql<{ id: number; contrato_id: number; correo: string; ok: boolean; at: string }>`
      SELECT id, contrato_id, correo, ok, at FROM crm_contrato_envios WHERE firmante_id = ANY(${firmantes})`;
    for (const e of envios.rows) hitos.push({ at: e.at, tipo: "contrato", titulo: e.ok ? "Enlace de firma enviado" : "Falló el envío del enlace", detalle: e.correo, entidad: "contrato", entidad_id: String(e.contrato_id) });
  }
  if (p.igsid) {
    const r = await opcional("social_mensajes", () => sql<{ id: string; texto: string | null; nuestro: boolean; ts: string }>`
      SELECT id, texto, nuestro, ts FROM social_mensajes WHERE igsid = ${p.igsid} ORDER BY ts DESC LIMIT 30`);
    for (const m of r) hitos.push({ at: m.ts, tipo: "dm", titulo: m.nuestro ? "DM enviado" : "DM recibido", detalle: m.texto, entidad: "dm", entidad_id: m.id });
  }

  return hitos.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limite);
}

/**
 * Una tabla vieja que aún no existe (base nueva, pruebas) no rompe la ficha.
 * Se pregunta al catálogo en vez de atrapar el error de SQL.
 */
async function opcional<T>(tabla: string, f: () => Promise<{ rows: T[] }>): Promise<T[]> {
  const r = await sql<{ ok: boolean }>`SELECT to_regclass(${tabla}) IS NOT NULL AS ok`;
  return r.rows[0]?.ok ? (await f()).rows : [];
}
