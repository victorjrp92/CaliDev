import assert from "node:assert/strict";
import { test } from "node:test";
import postgres from "postgres";
import { sql } from "@/lib/db";
import type { Actor } from "./actor";
import { asegurarEsquema } from "./esquema";
import { requerir } from "./guardia";
import { firmarSesion } from "./sesion";
import { aceptarInvitacion, cambiarActivo, crearClaveDe, crearUsuario, entrar } from "./usuarios";

/**
 * Núcleo del CRM contra una base real (PGlite local):
 *   SUPABASE_DB_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres \
 *   CRM_JWT_SECRET=<32+> npx tsx --test src/lib/crm/nucleo.test.ts
 */
const URL_BASE = "https://calidev.dev";
const sufijo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const pedir = (metodo: string, h: Record<string, string>) =>
  new Request(`${URL_BASE}/api/crm/v1/x`, { method: metodo, headers: { host: "calidev.dev", ...h } });

let duenoP: Promise<Actor> | null = null;
const dueno = () =>
  (duenoP ??= crearUsuario(null, { nombre: "Victor prueba", correo: `victor+${sufijo}@prueba.dev`, tipo: "humano", rol: "dueno" })
    .then(({ usuario }): Actor => ({ usuario, origen: "ui", alcances: null, claveId: null })));

test("el esquema se crea dos veces sin error", async () => {
  await asegurarEsquema();
  // Segunda vez forzada: los CREATE … IF NOT EXISTS y el trigger deben ser repetibles.
  const { asegurarEsquema: otra } = await import(`./esquema.ts?otra=${sufijo}`);
  await otra();
});

test("la auditoría no se puede editar ni borrar", async () => {
  const v = await dueno();
  const r = await sql<{ id: string }>`SELECT id FROM crm_auditoria WHERE entidad = 'usuario' AND entidad_id = ${String(v.usuario.id)}`;
  assert.equal(r.rows.length, 1, "crear un usuario deja una fila de auditoría");
  // Conexión propia: pglite-socket 0.1.1 deja una respuesta sobrante tras el error de un
  // trigger y la conexión siguiente recibe un resultado ajeno. Postgres real no lo hace.
  const aparte = postgres(process.env.SUPABASE_DB_URL!, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await assert.rejects(aparte`UPDATE crm_auditoria SET accion = 'x' WHERE id = ${r.rows[0].id}`, /solo admite INSERT/);
    await assert.rejects(aparte`DELETE FROM crm_auditoria WHERE id = ${r.rows[0].id}`, /solo admite INSERT/);
  } finally {
    await aparte.end({ timeout: 1 });
  }
});

test("la invitación sirve una sola vez y deja entrar con la contraseña elegida", async () => {
  const { invitacion, usuario } = await crearUsuario(null, { nombre: "Karen prueba", correo: `karen+${sufijo}@prueba.dev`, tipo: "humano", rol: "socia" });
  assert.ok(invitacion);
  await assert.rejects(aceptarInvitacion(invitacion, "corta"), /10 caracteres/);
  const u = await aceptarInvitacion(invitacion, "una contraseña larga");
  assert.equal(u.id, usuario.id);
  await assert.rejects(aceptarInvitacion(invitacion, "otra contraseña larga"), /ya se usó/);
  assert.ok(await entrar(`KAREN+${sufijo}@prueba.dev`, "una contraseña larga"));
  assert.equal(await entrar(`karen+${sufijo}@prueba.dev`, "contraseña equivocada"), null);
  assert.equal(await entrar(`nadie+${sufijo}@prueba.dev`, "una contraseña larga"), null);
});

test("un agente no puede tener rol humano", async () => {
  await assert.rejects(
    crearUsuario(null, { nombre: "Agente", correo: `ag-malo+${sufijo}@prueba.dev`, tipo: "agente", rol: "socia" }),
    /solo puede tener rol agente o sistema/,
  );
});

test("guardia: clave con alcance limitado, clave con secreto falso, sesión y origen", async () => {
  const v = await dueno();
  const { usuario: agente } = await crearUsuario(v, { nombre: "Agente prep", correo: `prep+${sufijo}@agentes.calidev`, tipo: "agente", rol: "agente" });

  // Pedir para la clave un permiso que el rol agente no tiene es un error, no un recorte silencioso.
  await assert.rejects(crearClaveDe(v, { usuarioId: agente.id, nombre: "mala", alcances: ["oportunidad:ganar"] }, true), /no tiene: oportunidad:ganar/);

  const { clave } = await crearClaveDe(v, { usuarioId: agente.id, nombre: "prep", alcances: ["ventas:leer", "notas:escribir"] }, true);
  const bearer = { authorization: `Bearer ${clave}` };

  const a = await requerir(pedir("GET", bearer), "ventas:leer");
  assert.equal(a.origen, "agente");
  await assert.rejects(requerir(pedir("POST", bearer), "ventas:escribir"), (e: { estado: number; codigo: string }) => e.estado === 403 && e.codigo === "sin_permiso");

  const falsa = clave.slice(0, -4) + (clave.endsWith("AAAA") ? "BBBB" : "AAAA");
  await assert.rejects(requerir(pedir("GET", { authorization: `Bearer ${falsa}` }), "ventas:leer"), (e: { estado: number }) => e.estado === 401);
  await assert.rejects(requerir(pedir("GET", {}), "ventas:leer"), (e: { codigo: string }) => e.codigo === "sin_sesion");

  // Sesión del navegador: lectura sin Origin pasa; escritura exige mismo sitio.
  const ver = (await sql<{ sesion_version: number }>`SELECT sesion_version FROM crm_usuarios WHERE id = ${v.usuario.id}`).rows[0].sesion_version;
  const cookie = { cookie: `otra=1; crm_sesion=${await firmarSesion({ usuarioId: v.usuario.id, rol: "dueno", version: ver })}` };
  assert.equal((await requerir(pedir("GET", cookie), "ventas:leer")).origen, "ui");
  await assert.rejects(requerir(pedir("POST", { ...cookie, origin: "https://malo.example" }), "ventas:escribir"), (e: { codigo: string }) => e.codigo === "origen_invalido");
  assert.ok(await requerir(pedir("POST", { ...cookie, origin: URL_BASE }), "ventas:escribir"));

  // Desactivar al agente revoca sus claves al instante.
  await cambiarActivo(v, agente.id, false);
  await assert.rejects(requerir(pedir("GET", bearer), "ventas:leer"), (e: { estado: number }) => e.estado === 401);
});
