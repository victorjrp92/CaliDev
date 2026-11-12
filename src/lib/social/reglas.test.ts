import { test } from "node:test";
import assert from "node:assert/strict";
import { decidir, reconocerBoton, siguienteRevision, puedeRespuestaPrivada, ventanaAbierta } from "./reglas";

const base = { modo: "automatico" as const, sensible: false, umbral: 0.7, detectarInteres: true };

test("debajo del umbral va a revisión", () => {
  assert.equal(decidir("felicitacion", 0.5, base), "revision");
});
test("tipos seguros → acción", () => {
  assert.equal(decidir("felicitacion", 0.9, base), "ia");
  assert.equal(decidir("etiqueta_emoji", 0.9, base), "ia");
  assert.equal(decidir("quiere_contacto", 0.9, base), "contacto");
  assert.equal(decidir("limpiaexpress", 0.9, base), "fijo_aliado");
  assert.equal(decidir("critica", 0.9, base), "fijo_critica");
  assert.equal(decidir("ofensa_spam", 0.9, base), "ignorar");
});
test("borradores y tema sensible mandan todo a revisión (salvo ofensa)", () => {
  assert.equal(decidir("felicitacion", 0.99, { ...base, modo: "borradores" }), "revision");
  assert.equal(decidir("quiere_contacto", 0.99, { ...base, sensible: true }), "revision");
  assert.equal(decidir("ofensa_spam", 0.99, { ...base, sensible: true }), "ignorar");
});
test("reconoce botones y variantes escritas", () => {
  const t = { botonSi: "Sí, tengo negocio", botonNo: "No", botonAliado: "Busco LimpiaExpress" };
  assert.equal(reconocerBoton("Sí, tengo negocio", t), "si");
  assert.equal(reconocerBoton("si", t), "si");
  assert.equal(reconocerBoton("  SÍ!! ", t), "si");
  assert.equal(reconocerBoton("No", t), "no");
  assert.equal(reconocerBoton("Busco LimpiaExpress", t), "aliado");
  assert.equal(reconocerBoton("limpia express", t), "aliado");
  assert.equal(reconocerBoton("tengo un spa en Madrid", t), null);
});
test("frecuencia según edad de la activación", () => {
  const h = 3600_000;
  assert.equal(siguienteRevision(1 * h), 60_000);
  assert.equal(siguienteRevision(80 * h), 15 * 60_000);
  assert.equal(siguienteRevision(15 * 24 * h), null); // se apaga
});
test("respuesta privada ≤ 7 días", () => {
  const ahora = Date.parse("2026-09-27T12:00:00Z");
  assert.equal(puedeRespuestaPrivada("2026-09-21T12:00:00+0000", ahora), true);
  assert.equal(puedeRespuestaPrivada("2026-09-19T12:00:00+0000", ahora), false);
});
test("ventana de 24 h", () => {
  const ahora = Date.parse("2026-09-27T12:00:00Z");
  assert.equal(ventanaAbierta("2026-09-26T13:00:00+0000", ahora), true);
  assert.equal(ventanaAbierta("2026-09-26T11:00:00+0000", ahora), false);
});

import { contieneClave, accionFinal } from "./reglas";

test("palabra clave sin importar tildes ni signos", () => {
  assert.equal(contieneClave("AYUDA 🙏", ["ayuda"]), true);
  assert.equal(contieneClave("Info por favor", ["ayuda", "info"]), true);
  assert.equal(contieneClave("ayudante de cocina", ["ayuda"]), false);
});
test("sin detección de interés, solo la clave abre el mensaje privado", () => {
  const c = { palabrasClave: ["ayuda"], detectarInteres: false };
  assert.equal(accionFinal("contacto", "¿esto sirve para mi panadería?", c), "ia");
  assert.equal(accionFinal("contacto", "ayuda", c), "contacto");
});
test("la clave sola rescata un dudoso", () => {
  const c = { palabrasClave: ["ayuda"], detectarInteres: true };
  assert.equal(accionFinal("revision", "Ayuda!", c), "contacto");
  assert.equal(accionFinal("revision", "no sé si ayuda o no esto la verdad", c), "revision");
});
test("la clave sola abre el privado aunque Jev la tome por etiqueta o emoji", () => {
  const c = { palabrasClave: ["orden"], detectarInteres: false };
  assert.equal(accionFinal("ia", "Orden", c), "contacto");
  assert.equal(accionFinal("ia", "orden 🙌", c), "contacto");
  assert.equal(accionFinal("ia", "me encantó el video, mucho orden en ese negocio", c), "ia");
  assert.equal(accionFinal("ignorar", "orden", c), "ignorar");
});

import { debeAbrirConversacion } from "./reglas";

test("el mensaje se abre una vez por publicación, no una vez por persona", () => {
  // nunca ha entrado: se le escribe
  assert.equal(debeAbrirConversacion(false, null), true);
  // seguidor que ya pasó por OTRO video: se le vuelve a escribir por este
  assert.equal(debeAbrirConversacion(false, "asesoria_enviada"), true);
  assert.equal(debeAbrirConversacion(false, "esperando_boton"), true);
  // ya entró por ESTA publicación: no se repite aunque comente otra vez
  assert.equal(debeAbrirConversacion(true, "esperando_boton"), false);
  // Victor la está atendiendo a mano: el agente no la toca
  assert.equal(debeAbrirConversacion(false, "revision"), false);
});

test("flujo recurso: la clave en cualquier parte abre el privado; el interés sin clave va a la bandeja", () => {
  const c = { palabrasClave: ["editar"], detectarInteres: true, flujoDm: "recurso" as const };
  assert.equal(accionFinal("ia", "EDITAR 🔥", c), "contacto");
  assert.equal(accionFinal("ia", "uff yo quiero aprender a editar así de rápido con eso", c), "contacto");
  assert.equal(accionFinal("contacto", "¿cuánto cuesta que me lo hagan?", c), "revision");
  assert.equal(accionFinal("ia", "qué buen video", c), "ia");
  assert.equal(accionFinal("ignorar", "editar gana plata fácil aquí", c), "ignorar");
});
test("en modo borradores o tema sensible la clave no salta la revisión", () => {
  assert.equal(accionFinal("revision", "editar", { palabrasClave: ["editar"], detectarInteres: true, flujoDm: "recurso", modo: "borradores" }), "revision");
  assert.equal(accionFinal("revision", "ayuda", { palabrasClave: ["ayuda"], detectarInteres: true, modo: "automatico", sensible: true }), "revision");
});
