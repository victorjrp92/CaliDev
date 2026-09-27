import { test } from "node:test";
import assert from "node:assert/strict";
import { detectorRabia, esClicMuerto } from "./seguimiento";

test("clic sobre una imagen suelta es muerto; dentro de un enlace no", () => {
  assert.equal(esClicMuerto([{ etiqueta: "img" }, { etiqueta: "div" }, { etiqueta: "section" }]), true);
  assert.equal(esClicMuerto([{ etiqueta: "img" }, { etiqueta: "a" }]), false);
  assert.equal(esClicMuerto([{ etiqueta: "span" }, { etiqueta: "div", rol: "button" }]), false);
});
test("tres clics rápidos en el mismo punto = rabia; separados no", () => {
  const d = detectorRabia();
  assert.equal(d(0, 100, 100), false);
  assert.equal(d(200, 102, 101), false);
  assert.equal(d(400, 99, 103), true);
  const e = detectorRabia();
  e(0, 0, 0); e(2000, 0, 0);
  assert.equal(e(4000, 0, 0), false);
  const f = detectorRabia();
  f(0, 0, 0); f(100, 200, 200);
  assert.equal(f(200, 400, 400), false);
});
