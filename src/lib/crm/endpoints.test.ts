import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ENDPOINTS } from "./endpoints";
import { PERMISOS } from "./permisos";

/**
 * La lista de ENDPOINTS es lo que lee un agente: si dice que existe un método,
 * su route.ts lo exporta; si un route.ts exporta un método, la lista lo dice.
 *   npx tsx --test src/lib/crm/endpoints.test.ts
 */
const RAIZ = join(process.cwd(), "src/app");
const BASE = join(RAIZ, "api/crm/v1");

function rutas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return rutas(p);
    return n === "route.ts" ? [p] : [];
  });
}

const metodosDe = (archivo: string) =>
  [...readFileSync(archivo, "utf8").matchAll(/^export const (GET|POST|PATCH|PUT|DELETE)\b/gm)].map((m) => m[1]).sort();

const archivoDe = (ruta: string) => join(RAIZ, ruta, "route.ts");

test("cada endpoint declarado tiene su route.ts con ese método", () => {
  for (const e of ENDPOINTS) {
    const metodos = metodosDe(archivoDe(e.ruta));
    assert.ok(metodos.includes(e.metodo), `${e.metodo} ${e.ruta} no está exportado en su route.ts`);
  }
});

test("cada método exportado bajo /api/crm/v1 está en la lista", () => {
  const declarados = new Set(ENDPOINTS.map((e) => `${e.metodo} ${e.ruta}`));
  for (const archivo of rutas(BASE)) {
    const ruta = "/" + archivo.slice(RAIZ.length + 1, -"/route.ts".length);
    for (const m of metodosDe(archivo)) assert.ok(declarados.has(`${m} ${ruta}`), `${m} ${ruta} existe pero no está en ENDPOINTS`);
  }
});

test("el permiso de cada endpoint existe y es el que pide su handler", () => {
  for (const e of ENDPOINTS) {
    if (e.permiso === "publico" || e.permiso === "sesion") continue;
    assert.ok((PERMISOS as readonly string[]).includes(e.permiso), `${e.ruta}: permiso desconocido ${e.permiso}`);
    const fuente = readFileSync(archivoDe(e.ruta), "utf8");
    const bloque = fuente.split(/^export const /m).find((b) => b.startsWith(`${e.metodo} `)) ?? "";
    assert.ok(bloque.includes(`requerir(request, "${e.permiso}")`), `${e.metodo} ${e.ruta} no pide ${e.permiso}`);
  }
});

test("sin duplicados", () => {
  const claves = ENDPOINTS.map((e) => `${e.metodo} ${e.ruta}`);
  assert.equal(new Set(claves).size, claves.length);
});
