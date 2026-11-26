import { test } from "node:test";
import assert from "node:assert/strict";
import { horaCompacta, horarioDesdeId, horarioDeCita, idDesdeInicio } from "./horarios";

test("las horas en punto siguen con el id de siempre", () => {
  const h = horarioDesdeId("2026-11-27T10")!;
  assert.equal(h.inicio.toISOString(), "2026-11-27T15:00:00.000Z");
  assert.equal(idDesdeInicio(h.inicio), "2026-11-27T10");
});

test("acepta la media hora y vuelve al mismo id", () => {
  const h = horarioDesdeId("2026-11-27T10:30")!;
  assert.equal(h.inicio.toISOString(), "2026-11-27T15:30:00.000Z");
  assert.equal(h.fin.toISOString(), "2026-11-27T16:30:00.000Z");
  assert.equal(idDesdeInicio(h.inicio), "2026-11-27T10:30");
  assert.equal(horarioDeCita({ inicio: "2026-11-27T15:30:00.000Z", tipo: "primera" })?.id, "2026-11-27T10:30");
});

test("rechaza minutos que no son :00 ni :30", () => {
  assert.equal(horarioDesdeId("2026-11-27T10:15"), undefined);
  assert.equal(horarioDesdeId("2026-11-27T10:3"), undefined);
});

test("la hora corta muestra los minutos solo si los hay", () => {
  assert.equal(horaCompacta(horarioDesdeId("2026-11-27T10")!.inicio), "10 a. m.");
  assert.equal(horaCompacta(horarioDesdeId("2026-11-27T10:30")!.inicio), "10:30 a. m.");
});
