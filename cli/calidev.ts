#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
/**
 * calidev: el CRM de calidev.dev desde la terminal (docs/crm/spec.md §7).
 * Habla con la misma API que la UI, con una clave cdv_…; todo comando acepta
 * --json. Códigos de salida: 0 ok · 2 uso · 3 sin permiso · 4 pendiente de
 * aprobación · 1 cualquier otro.
 */
import { activa, type Args, leerArgs } from "./lib/args.ts";
import { ErrorCli, SALIDA, errorUso } from "./lib/errores.ts";
import type { Resultado } from "./lib/salida.ts";
import * as api from "./comandos/api.ts";
import * as aprobacion from "./comandos/aprobacion.ts";
import * as auditoria from "./comandos/auditoria.ts";
import * as cita from "./comandos/cita.ts";
import * as hoy from "./comandos/hoy.ts";
import * as login from "./comandos/login.ts";
import * as nota from "./comandos/nota.ts";
import * as oportunidad from "./comandos/oportunidad.ts";
import * as persona from "./comandos/persona.ts";
import * as tarea from "./comandos/tarea.ts";
import * as yo from "./comandos/yo.ts";

type Comando = { ayuda: string; correr: (sub: string | undefined, a: Args) => Promise<Resultado>; conSub: boolean };

// Los comandos con subcomando reciben el resto de posicionales sin él.
const COMANDOS: Record<string, Comando> = {
  login: { ayuda: login.AYUDA, correr: (_s, a) => login.login(a), conSub: false },
  yo: { ayuda: yo.AYUDA, correr: (_s, a) => yo.yo(a), conSub: false },
  hoy: { ayuda: hoy.AYUDA, correr: (_s, a) => hoy.hoy(a), conSub: false },
  api: { ayuda: api.AYUDA, correr: (_s, a) => api.api(a), conSub: false },
  persona: { ayuda: persona.AYUDA, correr: persona.persona, conSub: true },
  oportunidad: { ayuda: oportunidad.AYUDA, correr: oportunidad.oportunidad, conSub: true },
  tarea: { ayuda: tarea.AYUDA, correr: tarea.tarea, conSub: true },
  nota: { ayuda: nota.AYUDA, correr: nota.nota, conSub: true },
  cita: { ayuda: cita.AYUDA, correr: cita.cita, conSub: true },
  aprobacion: { ayuda: aprobacion.AYUDA, correr: aprobacion.aprobacion, conSub: true },
  auditoria: { ayuda: auditoria.AYUDA, correr: (_s, a) => auditoria.auditoria(a), conSub: false },
};

const AYUDA_GENERAL = [
  "calidev: el CRM de calidev.dev desde la terminal",
  "",
  ...Object.values(COMANDOS).map((c) => c.ayuda),
  "",
  "Banderas de todos los comandos: --json (salida para agentes) · --idempotency-key K (escrituras reintentables)",
  "Salida: 0 ok · 2 uso · 3 sin permiso · 4 quedó pendiente de aprobación · 1 otro",
  "Configuración: ~/.config/calidev/config.json (o CALIDEV_CONFIG); CALIDEV_URL y CALIDEV_CLAVE la pisan.",
].join("\n");

async function main(argv: string[]): Promise<number> {
  let json = argv.includes("--json");
  try {
    const todo = leerArgs(argv);
    json = activa(todo, "json");
    const [nombre, ...resto] = todo.pos;
    if (!nombre || nombre === "ayuda" || nombre === "help") {
      process.stdout.write(AYUDA_GENERAL + "\n");
      return SALIDA.ok;
    }
    const c = COMANDOS[nombre];
    if (!c) throw errorUso(`Comando desconocido: ${nombre}. Corre calidev ayuda.`);
    if (activa(todo, "ayuda")) {
      process.stdout.write(c.ayuda + "\n");
      return SALIDA.ok;
    }
    const sub = c.conSub ? resto[0] : undefined;
    const r = await c.correr(sub, { pos: c.conSub ? resto.slice(1) : resto, flags: todo.flags });
    process.stdout.write((json ? JSON.stringify(r.datos, null, 2) : r.texto) + "\n");
    return r.pendiente ? SALIDA.pendiente : SALIDA.ok;
  } catch (e) {
    const err = e instanceof ErrorCli ? e : new ErrorCli(SALIDA.otro, "interno", (e as Error).message ?? String(e));
    // Con --json el error también es JSON, en stdout, con la forma de la API.
    if (json) process.stdout.write(JSON.stringify({ error: { codigo: err.codigo, mensaje: err.message, ...(err.campo ? { campo: err.campo } : {}) } }, null, 2) + "\n");
    else process.stderr.write(`calidev: ${err.message}\n`);
    return err.salida;
  }
}

process.exitCode = await main(process.argv.slice(2));
