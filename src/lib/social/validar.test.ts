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
test("flujo recurso: completa los textos, exige enlace y botones distintos", () => {
  const blog = { ...base, landingUrl: "https://calidev.dev/es/blog/como-editar-videos-con-claude-code", palabrasClave: ["editar"] };
  const r = validarAutomatizacion({ ...blog, textos: { flujoDm: "recurso", recurso: { exigirSeguir: true, botonEnviar: "Envíamelo ya mismo por favor" } } });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.valor.textos.flujoDm, "recurso");
    assert.equal(r.valor.textos.recurso?.exigirSeguir, true);
    assert.equal(r.valor.textos.recurso!.botonEnviar.length <= 20, true);
    assert.equal(r.valor.textos.recurso?.botonSeguido, "Ya te sigo");
  }
  assert.equal(validarAutomatizacion({ ...blog, landingUrl: null, textos: { flujoDm: "recurso" } }).ok, false);
  assert.equal(validarAutomatizacion({ ...blog, textos: { flujoDm: "recurso", recurso: { botonEnviar: "Listo", botonSeguido: "listo" } } }).ok, false);
});
