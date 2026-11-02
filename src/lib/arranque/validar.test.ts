import { test } from "node:test";
import assert from "node:assert/strict";
import { SECCIONES } from "./esquema";
import { SECCIONES_SEIRILEGAL } from "./esquema-seirilegal";
import { avance, errorCampo, limpiarSeccion, seccionCompleta } from "./validar";
import { filasAElementos } from "./excel";

const seccion = (id: string) => SECCIONES.find((s) => s.id === id)!;
const campo = (s: string, c: string) => seccion(s).campos.find((x) => x.id === c)!;

test("cédula: solo números, entre 5 y 12", () => {
  const c = campo("equipo", "documento");
  assert.equal(errorCampo(c, { documento: "1.144.050.645" }), null);
  assert.notEqual(errorCampo(c, { documento: "abc123" }), null);
  assert.notEqual(errorCampo(c, { documento: "123" }), null);
});

test("celular colombiano de 10 dígitos, con o sin +57", () => {
  const c = campo("negocio", "celular");
  assert.equal(errorCampo(c, { celular: "315 176 3051" }), null);
  assert.equal(errorCampo(c, { celular: "+57 315 176 3051" }), null);
  assert.notEqual(errorCampo(c, { celular: "12345" }), null);
});

test("un campo condicional solo se exige si aplica", () => {
  const c = campo("clientes", "conjunto");
  assert.equal(errorCampo(c, { vivienda: "Casa" }), null);
  assert.notEqual(errorCampo(c, { vivienda: "Apartamento" }), null);
});

test("porcentaje entre 0 y 100", () => {
  const c = campo("servicios", "porcentaje");
  assert.equal(errorCampo(c, { porcentaje: "40" }), null);
  assert.notEqual(errorCampo(c, { porcentaje: "140" }), null);
});

test("una lista vacía no está completa; con un elemento válido sí", () => {
  const s = seccion("servicios");
  assert.equal(seccionCompleta(s, { servicios: [] }), false);
  const ok = { nombre: "Limpieza general", cobro: "Por hora", valor: "25000", porcentaje: "40", insumos: "Sí" };
  assert.equal(seccionCompleta(s, { servicios: [ok] }), true);
  assert.equal(seccionCompleta(s, { servicios: [ok, { nombre: "Sin precio" }] }), false);
});

test("avance cuenta secciones completas", () => {
  assert.equal(avance({}).porcentaje, 0);
});

test("limpiar descarta campos que el esquema no conoce y opciones inventadas", () => {
  const v = limpiarSeccion(seccion("negocio"), { nombreNegocio: "Maison pure", hackeo: "x", fuentes: ["Instagram", "Inventada"] });
  assert.deepEqual(v, { nombreNegocio: "Maison pure", fuentes: ["Instagram"] });
});

test("Excel: reconoce títulos con o sin tildes, salta la fila de ejemplo y normaliza S/N", () => {
  const filas = [
    ["Nombre completo", "Cédula", "Celular", "Exento Pensión (S/N)", "Exento Caja (S/N)", "Columna rara"],
    ["EJEMPLO Ana", "1", "3", "N", "N", ""],
    ["Luz Rojas", "1.144.000.111", "3001234567", "s", "N", "x"],
  ];
  const r = filasAElementos(filas, seccion("equipo").campos);
  assert.equal(r.elementos.length, 1);
  assert.deepEqual(r.elementos[0], { nombre: "Luz Rojas", documento: "1144000111", celular: "3001234567", exentoPension: "Sí", exentoCaja: "No" });
  assert.deepEqual(r.ignoradas, ["Columna rara"]);
});

const legal = (id: string) => SECCIONES_SEIRILEGAL.find((s) => s.id === id)!;
const TOKEN = "a".repeat(32);
const BLOB = `https://abc.public.blob.vercel-storage.com/arranques/${TOKEN}`;

test("SeiriLegal: teléfono internacional con prefijo", () => {
  const c = legal("despacho").campos.find((x) => x.id === "telefono")!;
  assert.equal(errorCampo(c, { telefono: "+34 600 123 456" }), null);
  assert.notEqual(errorCampo(c, { telefono: "600" }), null);
});

test("SeiriLegal: los documentos de ejemplo piden su mínimo", () => {
  const c = legal("muestras").campos.find((x) => x.id === "documentos")!;
  const una = JSON.stringify({ tipo: "Pasaporte", paginas: [`${BLOB}/muestras/p.jpg`] });
  assert.match(errorCampo(c, { documentos: [una, una] }) ?? "", /faltan 8/);
  assert.equal(errorCampo(c, { documentos: Array(10).fill(una) }), null);
});

test("SeiriLegal: solo se guardan archivos de la carpeta del propio enlace", () => {
  const propio = JSON.stringify({ url: `${BLOB}/plantillas/hoja.docx`, nombre: "hoja.docx" });
  const ajeno = JSON.stringify({ url: `https://abc.public.blob.vercel-storage.com/arranques/${"b".repeat(32)}/x.docx`, nombre: "x" });
  const otroSitio = JSON.stringify({ url: "https://malo.com/arranques/x.docx", nombre: "x" });
  const v = limpiarSeccion(legal("plantillas"), { archivos: [propio, ajeno, otroSitio, "basura"] }, TOKEN) as Record<string, string[]>;
  assert.deepEqual(v.archivos, [propio]);
});

test("SeiriLegal: una muestra con tipo inventado no se guarda", () => {
  const raro = JSON.stringify({ tipo: "Inventado", paginas: [`${BLOB}/muestras/p.jpg`] });
  const v = limpiarSeccion(legal("muestras"), { documentos: [raro] }, TOKEN) as Record<string, string[]>;
  assert.deepEqual(v.documentos, []);
});

test("SeiriLegal: el avance se mide con sus propias secciones", () => {
  assert.equal(avance({}, SECCIONES_SEIRILEGAL).porcentaje, 0);
  assert.equal(avance({}, SECCIONES_SEIRILEGAL).completas.length, 0);
});

test("SeiriLegal · oficinas: «Otra provincia» en una pregunta de varias respuestas pide cuáles, y «En toda España» es válida", () => {
  const despacho = SECCIONES_SEIRILEGAL.find((s) => s.id === "despacho")!;
  const otras = despacho.campos.find((c) => c.id === "otrasOficinas")!;
  const oficinas = despacho.campos.find((c) => c.id === "oficinas")!;
  assert.notEqual(errorCampo(otras, { oficinas: ["Bizkaia", "Otra provincia"] }), null, "con «Otra provincia» marcada, «¿Cuáles otras?» aparece y es obligatoria");
  assert.equal(errorCampo(otras, { oficinas: ["Bizkaia", "Otra provincia"], otrasOficinas: "Cantabria" }), null);
  assert.equal(errorCampo(otras, { oficinas: ["Bizkaia", "Gipuzkoa"] }), null, "sin «Otra provincia» no se pide");
  assert.equal(errorCampo(oficinas, { oficinas: ["En toda España"] }), null);
});
