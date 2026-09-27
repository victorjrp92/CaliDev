import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarCaidas } from "./caidas";

const curva = [
  { s: 0, pct: 100 }, { s: 1, pct: 93 }, { s: 3, pct: 62 }, { s: 6, pct: 57 }, { s: 10, pct: 54 },
  { s: 17, pct: 50 }, { s: 19, pct: 40 }, { s: 22, pct: 38 }, { s: 58, pct: 26 },
];
const escenas = [{ t0: 0, t1: 3, dicho: "gancho" }, { t0: 3, t1: 17 }, { t0: 17, t1: 22, visual: "pantalla sin voz" }, { t0: 22, t1: 58 }];

test("encuentra la caída del gancho y la del segundo 17-19", () => {
  const c = detectarCaidas(curva, escenas);
  assert.equal(c.length, 2);
  assert.equal(c[0].gancho, true);
  assert.equal(c[0].puntos, 38);
  assert.equal(c[1].gancho, false);
  assert.equal(c[1].desde, 17);
  assert.equal(c[1].escena?.visual, "pantalla sin voz");
});
test("una bajada lenta no es caída", () => {
  assert.equal(detectarCaidas([{ s: 0, pct: 60 }, { s: 20, pct: 50 }, { s: 40, pct: 40 }], []).length, 0);
});
