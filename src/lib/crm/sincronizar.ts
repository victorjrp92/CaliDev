import { sql } from "@/lib/db";
import { horarioDeCita, tipoDe } from "@/lib/citas/horarios";
import { armarPersonas, type Persona as PersonaLegado } from "@/lib/seguimiento/personas";
import type { Actor } from "./actor";
import { avanceAutomatico, type Etapa, etapaDesdeLegado, estaAbierta } from "./etapas";
import { crearOportunidad, moverEtapa } from "./oportunidades";
import { crearPersona, enlazar, normalizarCorreo, normalizarWhatsapp, personaPorRef } from "./personas";

/**
 * Backfill: lo que vive en las tablas viejas (leads, citas, seguimiento,
 * contactos, social_personas) se vuelve personas y oportunidades del CRM.
 *
 * Se puede correr cuantas veces se quiera sin duplicar:
 * - una fila vieja se enlaza a una sola persona (`crm_personas_ref`, PK);
 * - el grupo del panel viejo (su clave: correo o `wa:<dígitos>`) tiene a lo
 *   sumo una oportunidad (`clave_legado` UNIQUE);
 * - antes de crear una persona se busca una existente con ese correo,
 *   WhatsApp o igsid.
 *
 * Solo avanza etapas abiertas, nunca cierra ni retrocede (etapas.ts): lo que
 * alguien movió a mano en el CRM manda.
 */
export type Resumen = { personas: number; enlaces: number; oportunidades: number; avances: number; errores: string[] };

const clavePor = (correo: string | null, whatsapp: string | null) =>
  correo ? correo.trim().toLowerCase() : `wa:${(whatsapp ?? "").replace(/\D/g, "")}`;

async function personaParecida(d: { correo?: string | null; whatsapp?: string | null; igsid?: string | null }): Promise<number | null> {
  const correo = normalizarCorreo(d.correo);
  const wa = normalizarWhatsapp(d.whatsapp);
  const r = await sql<{ id: number }>`
    SELECT id FROM crm_personas WHERE fusionada_en IS NULL AND (
      (${correo}::text IS NOT NULL AND lower(correo) = ${correo})
      OR (${wa}::text IS NOT NULL AND whatsapp = ${wa})
      OR (${d.igsid ?? null}::text IS NOT NULL AND igsid = ${d.igsid ?? null}))
    ORDER BY id LIMIT 1`;
  return r.rows[0]?.id ?? null;
}

/** La persona del CRM para esta fila vieja: la enlazada, una parecida o una nueva. */
async function asegurarPersona(
  actor: Actor | null,
  ref: { tabla: string; id: string | number },
  datos: { nombre: string; correo?: string | null; whatsapp?: string | null; igsid?: string | null; usuario_ig?: string | null; empresa?: string | null; origen: string },
  r: Resumen,
): Promise<number> {
  const ya = await personaPorRef(ref.tabla, ref.id);
  if (ya) return ya;
  let id = await personaParecida(datos);
  if (!id) {
    id = (await crearPersona(actor, datos)).id;
    r.personas++;
  }
  if (await enlazar(id, ref.tabla, ref.id)) r.enlaces++;
  return id;
}

const tituloDe = (p: PersonaLegado) => (p.empresa ? `${p.empresa} · ${p.nombre}` : p.nombre);

/** Próximo paso: la hora de la cita vigente si viene; si no, ahora (sale como vencido en Hoy). */
function fechaProxima(p: PersonaLegado, ahora: number): string {
  const h = p.vigente ? horarioDeCita(p.vigente) : undefined;
  return h && h.inicio.getTime() > ahora ? h.inicio.toISOString() : new Date(ahora).toISOString();
}

async function deLeadsYCitas(actor: Actor | null, r: Resumen, ahora: number) {
  const legado = await armarPersonas();
  // Ids de las filas viejas por clave, para enlazarlas todas (armarPersonas solo trae la última de cada tipo).
  const leads = await sql<{ id: number; email: string | null; whatsapp: string | null }>`
    SELECT id, email, whatsapp FROM leads WHERE name NOT LIKE 'PRUEBA CLAUDE%'`;
  const citas = await sql<{ id: number; correo: string; tipo: string | null }>`SELECT id, correo, tipo FROM citas`;
  const leadsDe = new Map<string, number[]>();
  for (const l of leads.rows) {
    const k = clavePor(l.email, l.whatsapp);
    leadsDe.set(k, [...(leadsDe.get(k) ?? []), l.id]);
  }
  const citasDe = new Map<string, number[]>();
  for (const c of citas.rows.filter((x) => tipoDe(x) !== "sesion")) {
    const k = clavePor(c.correo, null);
    citasDe.set(k, [...(citasDe.get(k) ?? []), c.id]);
  }

  for (const p of legado) {
    try {
      const datos = { nombre: p.nombre, correo: p.correo, whatsapp: p.whatsapp, empresa: p.empresa, origen: p.origen };
      const personaId = await asegurarPersona(actor, { tabla: "clave", id: p.clave }, datos, r);
      for (const id of leadsDe.get(p.clave) ?? []) if (await enlazar(personaId, "leads", id)) r.enlaces++;
      for (const id of citasDe.get(p.clave) ?? []) if (await enlazar(personaId, "citas", id)) r.enlaces++;

      const propuesta: Etapa = etapaDesdeLegado(p.etapa);
      const previa = await sql<{ id: number; etapa: Etapa }>`SELECT id, etapa FROM crm_oportunidades WHERE clave_legado = ${p.clave}`;
      const o = previa.rows[0];
      if (!o) {
        const cerrada = !estaAbierta(propuesta);
        const creada = await crearOportunidad(actor, {
          titulo: tituloDe(p),
          personaId,
          etapa: propuesta,
          proximoPaso: cerrada ? null : p.proximo,
          proximoPasoAt: cerrada ? null : fechaProxima(p, ahora),
          motivoPerdida: propuesta === "perdido" ? p.seguimiento?.nota?.trim() || "Marcada perdida en el panel viejo, sin motivo escrito." : null,
          origen: p.origen,
          claveLegado: p.clave,
        }).catch((e) => {
          // Otra corrida la creó entre la consulta y el INSERT: no es un error.
          if ((e as { codigo?: string }).codigo === "duplicada") return null;
          throw e;
        });
        if (creada) r.oportunidades++;
        continue;
      }
      const a = avanceAutomatico(o.etapa, propuesta);
      if (a) {
        await moverEtapa(actor, o.id, { a, proximoPaso: p.proximo, proximoPasoAt: fechaProxima(p, ahora) });
        r.avances++;
      }
    } catch (e) {
      r.errores.push(`${p.clave}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

async function deContactos(actor: Actor | null, r: Resumen) {
  const filas = await existe("contactos", () =>
    sql<{ id: number; nombre: string; correo: string }>`
      SELECT c.id, c.nombre, c.correo FROM contactos c
      WHERE NOT EXISTS (SELECT 1 FROM crm_personas_ref x WHERE x.tabla = 'contactos' AND x.ref_id = c.id::text)`);
  for (const c of filas) {
    try {
      await asegurarPersona(actor, { tabla: "contactos", id: c.id }, { nombre: c.nombre, correo: c.correo, origen: "Formulario de contacto" }, r);
    } catch (e) {
      r.errores.push(`contacto ${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

async function deInstagram(actor: Actor | null, r: Resumen) {
  const filas = await existe("social_personas", () =>
    sql<{ igsid: string; usuario: string | null }>`
      SELECT s.igsid, s.usuario FROM social_personas s
      WHERE NOT EXISTS (SELECT 1 FROM crm_personas_ref x WHERE x.tabla = 'social_personas' AND x.ref_id = s.igsid)`);
  for (const s of filas) {
    try {
      await asegurarPersona(actor, { tabla: "social_personas", id: s.igsid },
        { nombre: s.usuario ? `@${s.usuario}` : `IG ${s.igsid.slice(-6)}`, igsid: s.igsid, usuario_ig: s.usuario, origen: "Instagram" }, r);
    } catch (e) {
      r.errores.push(`ig ${s.igsid}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

/**
 * Las tablas viejas se crean al primer uso de su módulo: en una base donde aún
 * no existen, se omiten. Se pregunta al catálogo en vez de atrapar el error
 * (un error de SQL en medio deja mal a pglite-socket en las pruebas).
 */
async function existe<T>(tabla: string, f: () => Promise<{ rows: T[] }>): Promise<T[]> {
  const r = await sql<{ ok: boolean }>`SELECT to_regclass(${tabla}) IS NOT NULL AS ok`;
  return r.rows[0]?.ok ? (await f()).rows : [];
}

/** Corre el backfill completo, sin candado. Para pruebas y para `sincronizarSiToca`. */
export async function sincronizar(actor: Actor | null, ahora = Date.now()): Promise<Resumen> {
  const r: Resumen = { personas: 0, enlaces: 0, oportunidades: 0, avances: 0, errores: [] };
  if ((await sql<{ ok: boolean }>`SELECT to_regclass('leads') IS NOT NULL AS ok`).rows[0]?.ok) await deLeadsYCitas(actor, r, ahora);
  await deContactos(actor, r);
  await deInstagram(actor, r);
  return r;
}

/**
 * Corre el backfill si pasó el intervalo desde la última vez y nadie lo está
 * corriendo. El turno se toma con un UPDATE condicionado (atómico en
 * Postgres): dos peticiones simultáneas no lo corren dos veces. `hasta` es un
 * préstamo de 2 minutos por si la función muere a medias.
 */
export async function sincronizarSiToca(actor: Actor | null, intervaloSeg = 60): Promise<Resumen | null> {
  await sql`INSERT INTO crm_procesos (clave) VALUES ('backfill') ON CONFLICT DO NOTHING`;
  const turno = await sql`
    UPDATE crm_procesos SET hasta = NOW() + interval '2 minutes'
    WHERE clave = 'backfill' AND (hasta IS NULL OR hasta < NOW())
      AND (ultimo_at IS NULL OR ultimo_at < NOW() - make_interval(secs => ${intervaloSeg}))
    RETURNING clave`;
  if (!turno.rows[0]) return null;
  try {
    const r = await sincronizar(actor);
    await sql`UPDATE crm_procesos SET ultimo_at = NOW(), hasta = NULL, resultado = ${JSON.stringify(r)} WHERE clave = 'backfill'`;
    if (r.errores.length) console.error("[crm] backfill con errores", r.errores.slice(0, 10));
    return r;
  } catch (e) {
    await sql`UPDATE crm_procesos SET hasta = NULL WHERE clave = 'backfill'`;
    throw e;
  }
}
