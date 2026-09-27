import { test } from "node:test";
import assert from "node:assert/strict";
import { validarAutomatizacion } from "./validar";

const base = { modo: "automatico", umbral: 0.7, landingUrl: "https://calidev.dev/servinomic/limpiaexpress", palabrasClave: ["AYUDA", "ayuda", " info "], textos: {} };

test("valores válidos se normalizan y completan con los iniciales", () => {
  const r = validarAutomatizacion(base);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.valor.palabrasClave, ["ayuda", "info"]);
    assert.equal(r.valor.textos.botonSi, "Sí, tengo negocio");
  }
});
test("rechaza landing ajena, umbral fuera de rango y modo raro", () => {
  assert.equal(validarAutomatizacion({ ...base, landingUrl: "https://evil.com" }).ok, false);
  assert.equal(validarAutomatizacion({ ...base, umbral: 0.2 }).ok, false);
  assert.equal(validarAutomatizacion({ ...base, modo: "turbo" }).ok, false);
});
test("recorta botones a 20 y exige que sean distintos", () => {
  const r = validarAutomatizacion({ ...base, textos: { botonSi: "Sí, claro que tengo un negocio grande" } });
  assert.equal(r.ok && r.valor.textos.botonSi.length <= 20, true);
  assert.equal(validarAutomatizacion({ ...base, textos: { botonSi: "No", botonNo: "No" } }).ok, false);
});
