import { sql } from "@/lib/db";
import { asegurarTabla, borrarContratoSinFirmas, contratoPorId, crearContrato, type Firmante, firmantesDe } from "@/lib/contratos/datos";
import { correoEnlace, enlaceFirmante } from "@/lib/contratos/correos";
import { leerDatosServinomic } from "@/lib/contratos/leer-datos";
import { EJEMPLO_SERVINOMIC, type DatosServinomic, faltantesServinomic, htmlServinomic, tituloServinomic } from "@/lib/contratos/plantilla-servinomic";
import { type Correo, enviarCorreo } from "@/lib/delegar/correos/enviar";
import { type Actor, ErrorCrm } from "./actor";
import { type Aprobacion, registrarEjecutor, solicitar } from "./aprobaciones";
import { auditar } from "./auditoria";
import { exigir, puede } from "./guardia";
import { enlazar } from "./personas";

/**
 * Contratos en el CRM (spec §3, pestaña 7; fase 1b). El texto y las firmas
 * siguen donde estaban (`contratos`, `contrato_firmantes`, la página pública
 * /contratos/<token>); aquí se añade lo del CRM:
 * - un borrador armado desde la oportunidad (cliente, empresa y precio pactado),
 * - la unión contrato ↔ oportunidad ↔ persona ↔ empresa (`crm_contratos`),
 * - el envío del enlace de firma por correo, que es una acción externa: un
 *   humano con `contrato:enviar` lo manda; un agente deja una aprobación de
 *   tipo `enviar_contrato` y el correo sale cuando un humano la aprueba.
 *
 * El enlace de cada firmante es un secreto (quien lo tiene firma): solo lo ve
 * quien tiene `contrato:enviar`.
 */

export const TIPO_ENVIO = "enviar_contrato";

export type FirmanteCrm = {
  id: number;
  rol: string;
  etiqueta: string;
  nombre: string | null;
  correo: string | null;
  abierto_at: string | null;
  firmado_at: string | null;
  codigo_enviado_at: string | null;
  /** Solo para quien tiene `contrato:enviar`. */
  enlace?: string;
};

export type EnvioContrato = { id: number; firmante_id: number; correo: string; ok: boolean; at: string; enviado_por: string | null };

export type ContratoCrm = {
  id: number;
  titulo: string;
  huella: string;
  created_at: string;
  estado: "esperando" | "firmado";
  plantilla: string | null;
  oportunidad_id: number | null;
  oportunidad: string | null;
  persona_id: number | null;
  persona: string | null;
  persona_correo: string | null;
  empresa_id: number | null;
  empresa: string | null;
  firmantes: FirmanteCrm[];
};

type FilaContrato = Omit<ContratoCrm, "firmantes" | "estado">;

/** El envío real del correo. Las pruebas lo cambian para no llamar a Resend. */
let enviador: (c: Correo) => Promise<boolean> = enviarCorreo;
export function usarEnviador(fn: (c: Correo) => Promise<boolean>) {
  enviador = fn;
}

const esCorreo = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function aFirmante(f: Firmante, conEnlace: boolean): FirmanteCrm {
  return {
    id: f.id,
    rol: f.rol,
    etiqueta: f.etiqueta,
    nombre: f.nombre,
    correo: f.correo,
    abierto_at: f.abierto_at,
    firmado_at: f.firmado_at,
    codigo_enviado_at: f.codigo_enviado_at,
    ...(conEnlace ? { enlace: enlaceFirmante(f) } : {}),
  };
}

async function filas(f: { id?: number | null; oportunidadId?: number | null; personaId?: number | null; limite?: number }): Promise<FilaContrato[]> {
  await asegurarTabla();
  const lim = Math.min(Math.max(f.limite ?? 200, 1), 500);
  const r = await sql<FilaContrato>`
    SELECT c.id, c.titulo, c.huella, c.created_at, k.plantilla, k.oportunidad_id, o.titulo AS oportunidad,
      k.persona_id, p.nombre AS persona, p.correo AS persona_correo, k.empresa_id, e.nombre AS empresa
    FROM contratos c LEFT JOIN crm_contratos k ON k.contrato_id = c.id
    LEFT JOIN crm_oportunidades o ON o.id = k.oportunidad_id
    LEFT JOIN crm_personas p ON p.id = k.persona_id LEFT JOIN crm_empresas e ON e.id = k.empresa_id
    WHERE (${f.id ?? null}::int IS NULL OR c.id = ${f.id ?? null})
      AND (${f.oportunidadId ?? null}::int IS NULL OR k.oportunidad_id = ${f.oportunidadId ?? null})
      AND (${f.personaId ?? null}::int IS NULL OR k.persona_id = ${f.personaId ?? null})
    ORDER BY c.created_at DESC, c.id DESC LIMIT ${lim}`;
  return r.rows;
}

async function completar(actor: Actor, rows: FilaContrato[]): Promise<ContratoCrm[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const f = await sql<Firmante>`SELECT * FROM contrato_firmantes WHERE contrato_id = ANY(${ids}::int[]) ORDER BY contrato_id, orden`;
  const conEnlace = puede(actor, "contrato:enviar");
  return rows.map((r) => {
    const fs = f.rows.filter((x) => x.contrato_id === r.id);
    return { ...r, estado: fs.length && fs.every((x) => x.firmado_at) ? "firmado" : "esperando", firmantes: fs.map((x) => aFirmante(x, conEnlace)) };
  });
}

export async function listarContratos(actor: Actor, f: { estado?: string | null; oportunidadId?: number | null; personaId?: number | null; limite?: number } = {}): Promise<ContratoCrm[]> {
  exigir(actor, "contratos:leer");
  if (f.estado && f.estado !== "esperando" && f.estado !== "firmado") throw new ErrorCrm(400, "campo_invalido", "estado: esperando o firmado.", "estado");
  const todos = await completar(actor, await filas(f));
  return f.estado ? todos.filter((c) => c.estado === f.estado) : todos;
}

export async function contratoCrm(actor: Actor, id: number): Promise<ContratoCrm & { envios: EnvioContrato[] }> {
  exigir(actor, "contratos:leer");
  const [c] = await completar(actor, await filas({ id }));
  if (!c) throw new ErrorCrm(404, "no_existe", `No hay contrato ${id}.`);
  const e = await sql<EnvioContrato>`
    SELECT v.id, v.firmante_id, v.correo, v.ok, v.at, u.nombre AS enviado_por FROM crm_contrato_envios v
    LEFT JOIN crm_usuarios u ON u.id = v.enviado_por WHERE v.contrato_id = ${id} ORDER BY v.at DESC, v.id DESC`;
  return { ...c, envios: e.rows };
}

/* ── Borrador desde una oportunidad ─────────────────────────────────────── */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Hoy en Colombia como AAAA-MM-DD. */
export function hoyColombia(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(ahora);
}

/**
 * El arranque en dos cuotas, los primeros días de los dos meses siguientes
 * (como el contrato modelo: 950k + 900k), y la mensualidad desde el segundo.
 */
export function cuotasPara(arranque: number, hoy: string): Pick<DatosServinomic, "cuotas" | "mensualidadDesde"> {
  const [a, m] = hoy.split("-").map(Number);
  const mes = (n: number) => ({ nombre: MESES[(m - 1 + n) % 12], ano: a + Math.floor((m - 1 + n) / 12) });
  const m1 = mes(1);
  const m2 = mes(2);
  const cuando = (x: { nombre: string; ano: number }) => `Entre el 1 y el 5 de ${x.nombre} de ${x.ano}`;
  if (arranque < 100_000) return { cuotas: [{ cuando: cuando(m1), valor: arranque }], mensualidadDesde: `${m2.nombre} de ${m2.ano}` };
  const segunda = Math.floor(arranque / 2 / 50_000) * 50_000;
  return {
    cuotas: [{ cuando: cuando(m1), valor: arranque - segunda }, { cuando: cuando(m2), valor: segunda }],
    mensualidadDesde: `${m2.nombre} de ${m2.ano}`,
  };
}

/**
 * Fechas de texto que el contrato exige y que la oportunidad no sabe: el
 * arranque cierra el último día del mes siguiente y la permanencia corre desde
 * el mes de la primera mensualidad. Son un punto de partida; el humano las ajusta.
 */
export function fechasPara(hoy: string, meses: number): Pick<DatosServinomic, "finArranque" | "permanenciaDesde" | "permanenciaHasta"> {
  const [a, m] = hoy.split("-").map(Number);
  const fin = (n: number) => {
    const d = new Date(Date.UTC(a, m + n, 0)); // día 0 del mes siguiente = último día del mes m+n
    return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  };
  const desde = new Date(Date.UTC(a, m + 1, 1));
  return {
    finArranque: fin(1),
    permanenciaDesde: meses > 0 ? `1 de ${MESES[desde.getUTCMonth()]} de ${desde.getUTCFullYear()}` : "",
    permanenciaHasta: meses > 0 ? fin(1 + meses) : "",
  };
}

export type Borrador = {
  oportunidad_id: number;
  oportunidad: string;
  persona_id: number | null;
  persona_correo: string | null;
  empresa_id: number | null;
  datos: DatosServinomic;
};

type FilaOportunidad = {
  id: number; titulo: string; persona_id: number | null; empresa_id: number | null; moneda: string;
  valor_arranque: string | null; valor_mensual: string | null; persona: string | null; correo: string | null;
  empresa: string | null; empresa_persona: number | null;
};

/**
 * Los datos de la plantilla ya llenos con lo que sabe la oportunidad: nombre
 * del contacto, empresa, precio pactado (o el del contrato modelo si aún no
 * tiene), cuotas y fecha de hoy. Los precios publicados quedan al lado para
 * que el contrato muestre la promo aplicada.
 */
export async function borradorDesdeOportunidad(actor: Actor, oportunidadId: number, hoy = hoyColombia()): Promise<Borrador> {
  exigir(actor, "contratos:leer");
  const r = await sql<FilaOportunidad>`
    SELECT o.id, o.titulo, o.persona_id, o.empresa_id, o.moneda, o.valor_arranque, o.valor_mensual,
      p.nombre AS persona, p.correo, COALESCE(e.nombre, ep.nombre) AS empresa, p.empresa_id AS empresa_persona
    FROM crm_oportunidades o LEFT JOIN crm_personas p ON p.id = o.persona_id
    LEFT JOIN crm_empresas e ON e.id = o.empresa_id LEFT JOIN crm_empresas ep ON ep.id = p.empresa_id
    WHERE o.id = ${oportunidadId}`;
  const o = r.rows[0];
  if (!o) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${oportunidadId}.`);
  if (o.moneda !== "COP") throw new ErrorCrm(400, "campo_invalido", `La plantilla de ServiNomic es en pesos y esta oportunidad está en ${o.moneda}.`, "moneda");
  const arranque = o.valor_arranque != null ? Math.round(Number(o.valor_arranque)) : EJEMPLO_SERVINOMIC.arranque;
  const mensualidad = o.valor_mensual != null ? Math.round(Number(o.valor_mensual)) : EJEMPLO_SERVINOMIC.mensualidad;
  return {
    oportunidad_id: o.id,
    oportunidad: o.titulo,
    persona_id: o.persona_id,
    persona_correo: o.correo,
    empresa_id: o.empresa_id ?? o.empresa_persona,
    datos: {
      ...EJEMPLO_SERVINOMIC,
      nombre: o.persona ?? "",
      negocio: o.empresa ?? "",
      fecha: hoy,
      arranque,
      mensualidad,
      ...cuotasPara(arranque, hoy),
      ...fechasPara(hoy, EJEMPLO_SERVINOMIC.permanenciaMeses),
    },
  };
}

/* ── Crear y borrar ─────────────────────────────────────────────────────── */

export type NuevoContrato =
  | { plantilla: "servinomic"; datos: unknown; oportunidadId?: number | null; personaId?: number | null; empresaId?: number | null }
  | { plantilla: "libre"; titulo: string; html: string; firmantes: { rol: string; etiqueta: string }[]; alFirmar?: { asunto: string; texto: string }; oportunidadId?: number | null; personaId?: number | null; empresaId?: number | null };

export async function crearContratoCrm(actor: Actor, n: NuevoContrato): Promise<ContratoCrm> {
  exigir(actor, "contratos:escribir");
  let personaId = n.personaId ?? null;
  let empresaId = n.empresaId ?? null;
  if (n.oportunidadId != null) {
    const o = await sql<{ persona_id: number | null; empresa_id: number | null; empresa_persona: number | null }>`
      SELECT o.persona_id, o.empresa_id, p.empresa_id AS empresa_persona FROM crm_oportunidades o
      LEFT JOIN crm_personas p ON p.id = o.persona_id WHERE o.id = ${n.oportunidadId}`;
    if (!o.rows[0]) throw new ErrorCrm(404, "no_existe", `No hay oportunidad ${n.oportunidadId}.`, "oportunidad_id");
    personaId ??= o.rows[0].persona_id;
    empresaId ??= o.rows[0].empresa_id ?? o.rows[0].empresa_persona;
  }

  let creado: Awaited<ReturnType<typeof crearContrato>>;
  if (n.plantilla === "servinomic") {
    const d = leerDatosServinomic(n.datos);
    const faltan = faltantesServinomic(d);
    if (faltan.length) throw new ErrorCrm(400, "faltan_datos", `Para crearlo falta ${faltan.join(", ")}.`, "datos");
    creado = await crearContrato(tituloServinomic(d), htmlServinomic(d),
      [{ rol: "clienta", etiqueta: "La Clienta" }, { rol: "calidev", etiqueta: "CaliDev" }], JSON.stringify(d));
  } else {
    const titulo = n.titulo?.trim().slice(0, 200);
    if (!titulo) throw new ErrorCrm(400, "campo_requerido", "Falta titulo.", "titulo");
    if (typeof n.html !== "string" || n.html.length < 200) throw new ErrorCrm(400, "campo_invalido", "html: el texto completo del contrato (200 caracteres o más).", "html");
    const fs = (n.firmantes ?? []).filter((f) => f.rol?.trim() && f.etiqueta?.trim()).map((f) => ({ rol: f.rol.trim().slice(0, 40), etiqueta: f.etiqueta.trim().slice(0, 80) }));
    if (!fs.length) throw new ErrorCrm(400, "campo_requerido", "firmantes: al menos uno, con rol y etiqueta.", "firmantes");
    creado = await crearContrato(titulo, n.html, fs, n.alFirmar ? JSON.stringify({ alFirmar: n.alFirmar }) : null);
  }

  const id = creado.contrato.id;
  await sql`
    INSERT INTO crm_contratos (contrato_id, oportunidad_id, persona_id, empresa_id, plantilla, creado_por)
    VALUES (${id}, ${n.oportunidadId ?? null}, ${personaId}, ${empresaId}, ${n.plantilla}, ${actor.usuario.id})`;
  // La persona queda unida a su firmante (spec §4): el que no es CaliDev.
  const suyo = creado.firmantes.find((f) => f.rol !== "calidev");
  if (personaId && suyo) await enlazar(personaId, "contrato_firmantes", suyo.id);
  const c = (await completar(actor, await filas({ id })))[0];
  await auditar(actor, "crear", "contrato", id, null, { titulo: c.titulo, huella: c.huella, plantilla: n.plantilla, oportunidad_id: c.oportunidad_id, persona_id: c.persona_id });
  return c;
}

/** Solo un contrato sin ninguna firma: uno firmado es el registro de la firma. */
export async function borrarContratoCrm(actor: Actor, id: number): Promise<void> {
  exigir(actor, "contratos:escribir");
  const antes = await contratoPorId(id);
  if (!antes) throw new ErrorCrm(404, "no_existe", `No hay contrato ${id}.`);
  const fs = await firmantesDe(id);
  if (!(await borrarContratoSinFirmas(id))) throw new ErrorCrm(409, "ya_firmado", "Este contrato ya tiene firmas: no se borra. Si hay que corregirlo, crea otro.");
  await sql`DELETE FROM crm_personas_ref WHERE tabla = 'contrato_firmantes' AND ref_id = ANY(${fs.map((f) => String(f.id))}::text[])`;
  await sql`DELETE FROM crm_contrato_envios WHERE contrato_id = ${id}`;
  await sql`DELETE FROM crm_contratos WHERE contrato_id = ${id}`;
  await auditar(actor, "borrar", "contrato", id, { titulo: antes.titulo, huella: antes.huella }, null);
}

/* ── Enviar el enlace de firma ──────────────────────────────────────────── */

type Envio = { contratoId: number; firmante: Firmante; correo: string; titulo: string; nombre: string | null };

/** Valida contrato, firmante y correo. Se corre al pedir y otra vez al ejecutar (el payload pudo editarse). */
async function prepararEnvio(contratoId: number, firmanteId: number | null, correo: string | null): Promise<Envio> {
  const contrato = await contratoPorId(contratoId);
  if (!contrato) throw new ErrorCrm(404, "no_existe", `No hay contrato ${contratoId}.`);
  const fs = await firmantesDe(contratoId);
  const f = firmanteId != null ? fs.find((x) => x.id === firmanteId) : fs.find((x) => x.rol !== "calidev" && !x.firmado_at);
  if (!f) throw new ErrorCrm(firmanteId != null ? 404 : 409, firmanteId != null ? "no_existe" : "sin_pendientes",
    firmanteId != null ? `El contrato ${contratoId} no tiene el firmante ${firmanteId}.` : "No queda ningún firmante por firmar fuera de CaliDev.", "firmante_id");
  if (f.firmado_at) throw new ErrorCrm(409, "ya_firmado", `${f.etiqueta} ya firmó: no hace falta mandarle el enlace.`, "firmante_id");
  let para = correo?.trim() || null;
  let nombre = f.nombre;
  if (!para) {
    const p = await sql<{ correo: string | null; nombre: string }>`
      SELECT p.correo, p.nombre FROM crm_personas_ref r JOIN crm_personas p ON p.id = r.persona_id
      WHERE r.tabla = 'contrato_firmantes' AND r.ref_id = ${String(f.id)}`;
    para = p.rows[0]?.correo ?? f.correo ?? null;
    nombre ??= p.rows[0]?.nombre ?? null;
  }
  if (!para) throw new ErrorCrm(400, "campo_requerido", `No sé a qué correo mandárselo a ${f.etiqueta}: pasa correo.`, "correo");
  if (!esCorreo(para)) throw new ErrorCrm(400, "campo_invalido", `«${para}» no parece un correo.`, "correo");
  return { contratoId, firmante: f, correo: para.toLowerCase(), titulo: contrato.titulo, nombre };
}

async function ejecutarEnvio(actor: Actor, e: Envio) {
  const contrato = (await contratoPorId(e.contratoId))!;
  const ok = await enviador(correoEnlace(e.firmante, contrato, e.correo, e.nombre));
  const r = await sql<{ id: number }>`
    INSERT INTO crm_contrato_envios (contrato_id, firmante_id, correo, enviado_por, ok)
    VALUES (${e.contratoId}, ${e.firmante.id}, ${e.correo}, ${actor.usuario.id}, ${ok}) RETURNING id`;
  await auditar(actor, ok ? "enviar" : "enviar_fallido", "contrato", e.contratoId, null, { firmante_id: e.firmante.id, etiqueta: e.firmante.etiqueta, correo: e.correo });
  if (!ok) throw new ErrorCrm(502, "correo_fallido", `El correo a ${e.correo} no salió (Resend). Revisa RESEND_API_KEY o manda el enlace a mano.`);
  return { envio_id: r.rows[0].id, contrato_id: e.contratoId, firmante_id: e.firmante.id, correo: e.correo };
}

export type ResultadoEnvio =
  | { estado: "enviado"; envio_id: number; contrato_id: number; firmante_id: number; correo: string }
  | { estado: "pendiente"; aprobacion: Aprobacion };

/**
 * Manda el enlace de firma. Quien tiene `contrato:enviar` (un humano) lo manda
 * ya; quien no (un agente) deja la aprobación con el correo exacto que saldrá.
 * Sirve también para reenviar: cada envío queda en `crm_contrato_envios`.
 */
export async function enviarContrato(actor: Actor, contratoId: number, o: { firmanteId?: number | null; correo?: string | null } = {}): Promise<ResultadoEnvio> {
  exigir(actor, "contratos:leer");
  const e = await prepararEnvio(contratoId, o.firmanteId ?? null, o.correo ?? null);
  if (puede(actor, "contrato:enviar")) return { estado: "enviado", ...(await ejecutarEnvio(actor, e)) };
  const contrato = (await contratoPorId(contratoId))!;
  // La vista previa no lleva el enlace real: es un secreto y la cola la leen agentes.
  const correo = correoEnlace({ ...e.firmante, token: "<enlace personal>" }, contrato, e.correo, e.nombre);
  const aprobacion = await solicitar(actor, {
    tipo: TIPO_ENVIO,
    payload: { contrato_id: contratoId, firmante_id: e.firmante.id, correo: e.correo },
    vistaPrevia: `Para: ${e.correo} (${e.firmante.etiqueta})\nAsunto: ${correo.asunto}\n\n${correo.texto.replace("https://calidev.dev/contratos/<enlace personal>", "[enlace de firma de " + e.firmante.etiqueta + "]")}`,
    entidad: "contrato",
    entidadId: contratoId,
  });
  return { estado: "pendiente", aprobacion };
}

// Al aprobarse, el correo sale con el payload aprobado (tal cual o editado), validado otra vez.
registrarEjecutor(TIPO_ENVIO, async (payload, aprobador) => {
  const id = Number(payload.contrato_id);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorCrm(400, "campo_invalido", "contrato_id inválido.");
  const fid = payload.firmante_id == null ? null : Number(payload.firmante_id);
  const e = await prepararEnvio(id, fid, typeof payload.correo === "string" ? payload.correo : null);
  return ejecutarEnvio(aprobador, e);
});
