import { test } from "node:test";
import assert from "node:assert/strict";
import type { Cita } from "./datos";
import { duracionDe, horarioDesdeId, tipoDe } from "./horarios";
import { correoSesiones } from "./correo-sesiones";
import { correoAvisoCita, correoConfirmacionCita } from "./correo-reserva";
import { avisoParaElla, avisoParaVictor } from "./correo-avisos";
import { ics } from "./ics";

const cita = (id: number, horarios: string, extra: Partial<Cita> = {}): Cita =>
  ({
    id,
    token: String(id).repeat(32),
    nombre: "María José",
    correo: "cliente@ejemplo.co",
    inicio: null,
    secuencia: 0,
    horarios,
    tipo: "sesion",
    mensaje: `Sesión ${id} de 3`,
    recordatorio_at: null,
    avisos: null,
    reservada_at: null,
    created_at: "",
    ...extra,
  }) as Cita;

const tres = [cita(1, "2030-03-06T08,2030-03-06T09"), cita(2, "2030-03-13T08"), cita(3, "2030-03-20T10")];
const hora = horarioDesdeId("2030-03-06T08")!;

test("una sesión dura una hora", () => {
  assert.equal(tipoDe(tres[0]), "sesion");
  assert.equal(duracionDe(tres[0]), 60);
});

test("un solo correo con un bloque por sesión, cada hora con el enlace de su propia cita", () => {
  const c = correoSesiones("María José", "Maison pure", tres);
  for (const rotulo of ["Sesión 1 de 3", "Sesión 2 de 3", "Sesión 3 de 3"]) assert.ok(c.html.includes(rotulo), rotulo);
  assert.ok(c.html.includes(`/cita/${"1".repeat(32)}?h=${encodeURIComponent("2030-03-06T09")}`));
  assert.ok(c.html.includes(`/cita/${"2".repeat(32)}?h=${encodeURIComponent("2030-03-13T08")}`));
  assert.ok(c.html.includes(`/cita/${"3".repeat(32)}?h=${encodeURIComponent("2030-03-20T10")}`));
  assert.ok(!c.html.includes(`/cita/${"2".repeat(32)}?h=${encodeURIComponent("2030-03-06T08")}`), "una sesión no ofrece las horas de otra");
  assert.equal(c.para, "cliente@ejemplo.co");
});

test("el correo lleva el nombre completo y no suena a venta", () => {
  const c = correoSesiones("María José", "Maison pure", tres);
  assert.match(c.asunto, /^María José, agendemos tus Sesiones de Dirección Estratégica\.$/);
  assert.ok(c.html.includes("Maison pure"));
  assert.ok(c.html.includes("tres horas"));
  assert.doesNotMatch(c.html + c.texto, /gratuita|Víctor Ramos te invita/);
});

test("la confirmación de una sesión dice cuál es y que está en el contrato", () => {
  const c = correoConfirmacionCita(tres[0], hora, false);
  assert.match(c.asunto, /^Sesión 1 de 3 confirmada: /);
  assert.ok(c.html.includes("María José"));
  assert.ok(c.html.includes("incluida en tu contrato"));
  assert.doesNotMatch(c.html + c.texto, /gratuita|reservaste una videollamada/);
  assert.match(c.adjuntos![0].contenido, /SUMMARY:Dirección Estratégica · Sesión 1 de 3/);
});

test("los avisos a ella y a Víctor hablan de la sesión", () => {
  const ella = avisoParaElla(tres[0], hora, "24h");
  assert.match(ella.asunto, /^Mañana: tu sesión 1 de 3 de Dirección Estratégica con Víctor/);
  assert.doesNotMatch(ella.html, /videollamada con CaliDev/);
  const victor = avisoParaVictor(tres[0], hora, "1h");
  assert.match(victor.asunto, /^En 1 hora · sesión 1 de 3 con María José/);
  const reserva = correoAvisoCita(tres[0], hora, false);
  assert.ok(reserva.html.includes("Sesión 1 de 3 de Dirección Estratégica"));
});

test("control: una primera videollamada sigue diciendo lo de siempre", () => {
  const primera = cita(9, "2030-03-06T08", { tipo: "primera", mensaje: null, nombre: "Ana Ruiz" });
  const c = correoConfirmacionCita(primera, hora, false);
  assert.match(c.asunto, /^Videollamada confirmada: /);
  assert.ok(c.html.includes("gratuita"));
  assert.ok(c.html.includes("Listo, Ana."), "a los leads se les saluda por el primer nombre");
  assert.match(ics(primera, hora, "REQUEST"), /SUMMARY:Videollamada con Víctor \(CaliDev\) · Ana Ruiz/);
  assert.equal(avisoParaElla(primera, hora, "24h").asunto, "Mañana: tu videollamada con Víctor (CaliDev)");
});
