import assert from "node:assert/strict";
import { test } from "node:test";
import { avanceAutomatico, etapaDesdeLegado, problemaDeCambio } from "./etapas";

test("una oportunidad abierta exige próximo paso con fecha", () => {
  assert.equal(problemaDeCambio({ a: "propuesta" })?.campo, "proximo_paso");
  assert.equal(problemaDeCambio({ a: "propuesta", proximoPaso: "Mandar propuesta" })?.campo, "proximo_paso_at");
  assert.equal(problemaDeCambio({ a: "propuesta", proximoPaso: "Mandar", proximoPasoAt: "mañana" })?.campo, "proximo_paso_at");
  assert.equal(problemaDeCambio({ a: "propuesta", proximoPaso: "Mandar", proximoPasoAt: "2026-11-25" }), null);
});

test("perdida exige motivo; ganado y pausa no exigen próximo paso", () => {
  assert.equal(problemaDeCambio({ a: "perdido" })?.campo, "motivo_perdida");
  assert.equal(problemaDeCambio({ a: "perdido", motivoPerdida: "precio" }), null);
  assert.equal(problemaDeCambio({ a: "ganado" }), null);
  assert.equal(problemaDeCambio({ a: "pausa" }), null);
  assert.equal(problemaDeCambio({ a: "cerrado" as never })?.campo, "etapa");
});

test("mapeo desde el panel viejo", () => {
  assert.equal(etapaDesdeLegado("por-invitar"), "lead");
  assert.equal(etapaDesdeLegado("cita-1"), "diagnostico_agendado");
  assert.equal(etapaDesdeLegado("cita-2"), "diagnostico_hecho");
  assert.equal(etapaDesdeLegado("ganado"), "ganado");
  assert.equal(etapaDesdeLegado("inventada"), "lead");
});

test("el backfill solo avanza y nunca cierra", () => {
  assert.equal(avanceAutomatico("lead", "diagnostico_agendado"), "diagnostico_agendado");
  assert.equal(avanceAutomatico("propuesta", "diagnostico_agendado"), null, "no retrocede");
  assert.equal(avanceAutomatico("lead", "ganado"), null, "no cierra");
  assert.equal(avanceAutomatico("perdido", "propuesta"), null, "no reabre");
});
