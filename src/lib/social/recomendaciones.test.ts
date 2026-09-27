import { test } from "node:test";
import assert from "node:assert/strict";
import { recomendaciones, type FilaRecomendable } from "./recomendaciones";

const fila = (x: Partial<FilaRecomendable>): FilaRecomendable => ({
  mediaId: "1", titulo: "Video", landing: null, modo: null, interesados: 0, vistas: 0, leads: 0, revision: 0, ...x,
});

test("sin datos que lo justifiquen, no recomienda nada", () => {
  assert.deepEqual(recomendaciones([fila({})], 1, true), []);
});
test("interesados sin landing", () => {
  const r = recomendaciones([fila({ interesados: 3 })], 1, true);
  assert.equal(r.length, 1);
  assert.match(r[0].texto, /3 personas interesadas/);
});
test("reloj caído solo importa si hay algo automatizado", () => {
  assert.equal(recomendaciones([], 30, false).length, 0);
  assert.match(recomendaciones([], 30, true)[0].texto, /reloj/);
});
test("alcance sin leads y cola larga", () => {
  const r = recomendaciones([fila({ vistas: 5000, landing: "x", revision: 6 })], 1, true);
  assert.equal(r.length, 2);
});
