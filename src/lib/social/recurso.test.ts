import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirRecurso, esToque, necesitaSaberSiSigue } from "./recurso";

const botones = ["Envíamelo", "Ya te sigo"];

test("el toque del botón o una respuesta corta cuentan; una pregunta va a la bandeja", () => {
  assert.equal(esToque("Envíamelo", botones), true);
  assert.equal(esToque("ya te sigo!", botones), true);
  assert.equal(esToque("listo", botones), true);
  assert.equal(esToque("👍", botones), true);
  assert.equal(esToque("cuánto cuesta?", botones), false);
  assert.equal(esToque("hola, quería saber si ustedes también hacen páginas web para restaurantes", botones), false);
});

test("sin exigir seguir: con el toque se entrega", () => {
  assert.equal(necesitaSaberSiSigue("esperando_recurso", false), false);
  assert.deepEqual(decidirRecurso("esperando_recurso", true, false, null), { tipo: "entregar", paso: "recurso_enviado" });
});

test("exige seguir y ya sigue: se entrega a la primera", () => {
  assert.equal(necesitaSaberSiSigue("esperando_recurso", true), true);
  assert.deepEqual(decidirRecurso("esperando_recurso", true, true, true), { tipo: "entregar", paso: "recurso_enviado" });
});

test("no sigue: se le pide, primer «Ya te sigo» fallido avisa, el segundo entrega igual", () => {
  assert.deepEqual(decidirRecurso("esperando_recurso", true, true, false), { tipo: "pedir_seguir", paso: "esperando_seguir" });
  assert.deepEqual(decidirRecurso("esperando_seguir", true, true, false), { tipo: "reintento", paso: "esperando_seguir_2" });
  assert.equal(necesitaSaberSiSigue("esperando_seguir_2", true), false);
  assert.deepEqual(decidirRecurso("esperando_seguir_2", true, true, null), { tipo: "entregar", paso: "recurso_enviado" });
});

test("ya la sigue al primer «Ya te sigo»: se entrega", () => {
  assert.deepEqual(decidirRecurso("esperando_seguir", true, true, true), { tipo: "entregar", paso: "recurso_enviado" });
});

test("lo que no es toque, o llega después de la entrega, va a la bandeja sin sacarla del flujo", () => {
  assert.deepEqual(decidirRecurso("esperando_recurso", false, true, null), { tipo: "bandeja" });
  assert.deepEqual(decidirRecurso("esperando_seguir", false, true, null), { tipo: "bandeja" });
  assert.deepEqual(decidirRecurso("recurso_enviado", true, true, null), { tipo: "bandeja" });
  assert.equal(necesitaSaberSiSigue("recurso_enviado", true), false);
});

test("si hacía falta saber si sigue y no se consultó, es un error de programación", () => {
  assert.throws(() => decidirRecurso("esperando_recurso", true, true, null));
});
