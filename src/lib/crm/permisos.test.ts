import { test } from "node:test";
import assert from "node:assert/strict";
import { alcancesValidos, PROHIBIDOS_AGENTE, ROLES, ROLES_AGENTE, tienePermiso } from "./permisos";

const victor = { tipo: "humano" as const, rol: "dueno" };
const karen = { tipo: "humano" as const, rol: "socia" };
const agente = { tipo: "agente" as const, rol: "agente" };

test("Victor puede todo; Karen aprueba pero no gestiona usuarios", () => {
  assert.equal(tienePermiso(victor, null, "usuarios:gestionar"), true);
  assert.equal(tienePermiso(karen, null, "aprobaciones:decidir"), true);
  assert.equal(tienePermiso(karen, null, "oportunidad:ganar"), true);
  assert.equal(tienePermiso(karen, null, "usuarios:gestionar"), false);
  assert.equal(tienePermiso(karen, null, "claves:gestionar"), false);
});

test("los agentes no cierran: lo prohibido se niega aunque la clave diga *", () => {
  for (const p of PROHIBIDOS_AGENTE) assert.equal(tienePermiso(agente, ["*"], p), false, p);
  assert.equal(tienePermiso({ tipo: "agente", rol: "dueno" }, ["*"], "ventas:leer"), false);
});

test("la clave limita al rol: sin ventas:escribir no mueve etapas", () => {
  const prep = ["ventas:leer", "contactos:escribir", "notas:escribir"];
  assert.equal(tienePermiso(agente, prep, "ventas:leer"), true);
  assert.equal(tienePermiso(agente, prep, "ventas:escribir"), false);
  assert.equal(tienePermiso(agente, ["ventas:*"], "ventas:escribir"), true);
});

test("la clave nunca amplía al rol", () => {
  assert.equal(tienePermiso(agente, ["*"], "finanzas:escribir"), false);
  assert.deepEqual(alcancesValidos("agente", "agente", ["ventas:leer", "finanzas:escribir", "precio:fijar"]),
    { ok: ["ventas:leer"], invalidos: ["finanzas:escribir", "precio:fijar"] });
});

test("un rol desconocido no tiene nada", () => {
  assert.equal(tienePermiso({ tipo: "humano", rol: "admin" }, null, "ventas:leer"), false);
});

test("ningún rol de agente trae permisos prohibidos, y si alguien los agrega igual se niegan", () => {
  for (const r of ROLES_AGENTE) for (const p of PROHIBIDOS_AGENTE) assert.equal(ROLES[r].has(p), false, `${r} ${p}`);
  const roles = ROLES as Record<string, Set<string>>;
  const original = roles.agente;
  roles.agente = new Set([...original, "oportunidad:ganar"]);
  try {
    assert.equal(tienePermiso(agente, ["*"], "oportunidad:ganar"), false);
  } finally {
    roles.agente = original;
  }
});
