import { test } from "node:test";
import assert from "node:assert/strict";
import { SECCIONES, type Campo, type Respuestas, type Seccion, type Valores } from "./esquema";
import { SECCIONES_SEIRILEGAL } from "./esquema-seirilegal";
import { avance, errorCampo, limpiarSeccion, seccionCompleta, visible } from "./validar";
import { respuestasAnteriores } from "./anteriores";
import { plantillaDe } from "./plantillas";
import { filasAElementos } from "./excel";
import { aplicarEleccion, elegidos } from "./elegir";

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

// El campo de muestras ya no está en el formulario de SeiriLegal, pero sigue disponible: se prueba suelto.
const MUESTRAS: Campo = { id: "documentos", etiqueta: "Ejemplos", tipo: "muestras", requerido: true, minimo: 3 };
const SECCION_MUESTRAS: Seccion = { id: "muestras", titulo: "Ejemplos", intro: "", logro: "", tipo: "campos", campos: [MUESTRAS] };

test("muestras: piden su mínimo", () => {
  const una = JSON.stringify({ tipo: "Pasaporte", paginas: [`${BLOB}/muestras/p.jpg`] });
  assert.match(errorCampo(MUESTRAS, { documentos: [una, una] }) ?? "", /faltan 1/);
  assert.equal(errorCampo(MUESTRAS, { documentos: Array(3).fill(una) }), null);
});

// Tampoco quedan subidas de archivos en SeiriLegal; la regla de la carpeta se prueba con una sección suelta.
const SECCION_ARCHIVOS: Seccion = { id: "archivos", titulo: "Archivos", intro: "", logro: "", tipo: "campos", campos: [{ id: "archivos", etiqueta: "Archivos", tipo: "archivos", requerido: true }] };

test("archivos: solo se guardan los de la carpeta del propio enlace", () => {
  const propio = JSON.stringify({ url: `${BLOB}/plantillas/hoja.docx`, nombre: "hoja.docx" });
  const ajeno = JSON.stringify({ url: `https://abc.public.blob.vercel-storage.com/arranques/${"b".repeat(32)}/x.docx`, nombre: "x" });
  const otroSitio = JSON.stringify({ url: "https://malo.com/arranques/x.docx", nombre: "x" });
  const v = limpiarSeccion(SECCION_ARCHIVOS, { archivos: [propio, ajeno, otroSitio, "basura"] }, TOKEN) as Record<string, string[]>;
  assert.deepEqual(v.archivos, [propio]);
});

test("muestras: una con tipo inventado no se guarda", () => {
  const raro = JSON.stringify({ tipo: "Inventado", paginas: [`${BLOB}/muestras/p.jpg`] });
  const v = limpiarSeccion(SECCION_MUESTRAS, { documentos: [raro] }, TOKEN) as Record<string, string[]>;
  assert.deepEqual(v.documentos, []);
});

test("SeiriLegal: el avance se mide con sus propias secciones", () => {
  assert.equal(avance({}, SECCIONES_SEIRILEGAL).porcentaje, 0);
  assert.equal(avance({}, SECCIONES_SEIRILEGAL).completas.length, 0);
});

test("SeiriLegal · oficinas: «Otra provincia» muestra «¿Cuáles otras?» sin exigirla, y «En toda España» es válida", () => {
  const despacho = SECCIONES_SEIRILEGAL.find((s) => s.id === "despacho")!;
  const otras = despacho.campos.find((c) => c.id === "otrasOficinas")!;
  const oficinas = despacho.campos.find((c) => c.id === "oficinas")!;
  assert.equal(visible(otras, { oficinas: ["Bizkaia", "Otra provincia"] }), true, "con «Otra provincia» marcada, «¿Cuáles otras?» aparece");
  assert.equal(errorCampo(otras, { oficinas: ["Bizkaia", "Otra provincia"] }), null, "pero no bloquea la sección si se deja en blanco");
  assert.equal(errorCampo(otras, { oficinas: ["Bizkaia", "Otra provincia"], otrasOficinas: "Cantabria" }), null);
  assert.equal(errorCampo(otras, { oficinas: ["Bizkaia", "Gipuzkoa"] }), null, "sin «Otra provincia» no se pide");
  assert.equal(errorCampo(oficinas, { oficinas: ["En toda España"] }), null);
});

test("SeiriLegal · trámites: lo ya respondido sigue completo y cada trámite trae su lista de documentos para marcar", () => {
  const tramites = legal("tramites");
  const yaRespondido = { tramite: "Renovación de residencia", volumen: "De 3 a 5", documentos: "pasaporte completo\ntie ambas caras", honorarios: "230 € con IVA" };
  for (const c of tramites.campos) assert.equal(errorCampo(c, yaRespondido), null, `«${c.etiqueta}» no debe invalidar lo que ya respondió`);
  const visibles = tramites.campos.filter((c) => c.id.startsWith("docs-") && c.visibleSi?.valores.includes("Renovación de residencia"));
  assert.equal(visibles.length, 1, "solo aparece la lista del trámite elegido");
  assert.ok(visibles[0].opciones!.includes("Vida laboral"));
  assert.equal(errorCampo(visibles[0], { tramite: "Renovación de residencia", [visibles[0].id]: ["Vida laboral", "Pasaporte completo"] }), null);
});

// Cobro, familias y contratos no se preguntan: ya los sabemos por su contrato,
// por lo que contó el 2-nov y por los modelos que ya envió.
const TOQUES = { abiertos: "Entre 30 y 100", traspaso: "Mejor los cargamos juntos el día de la entrega", notificaciones: "A los dos", firma: "De las dos formas" };
const DRIVE = "Están en Google Drive: puedo compartir la carpeta";

test("SeiriLegal · para terminar: cuatro preguntas de un toque, y la de carpetas solo si están en Drive", () => {
  const s = legal("cierre");
  assert.deepEqual(s.campos.map((c) => c.id), ["abiertos", "traspaso", "carpetas", "notificaciones", "firma"]);
  assert.ok(s.campos.every((c) => c.tipo === "opcion" && c.requerido));
  assert.deepEqual(s.campos.filter((c) => c.visibleSi).map((c) => c.id), ["carpetas"]);
  assert.equal(seccionCompleta(s, { cierre: TOQUES }), true);
  assert.equal(seccionCompleta(s, { cierre: { ...TOQUES, traspaso: DRIVE } }), false, "con Drive falta decir cómo están las carpetas");
  assert.equal(seccionCompleta(s, { cierre: { ...TOQUES, traspaso: DRIVE, carpetas: "Una por cliente" } }), true);
  assert.equal(seccionCompleta(s, { cierre: { abiertos: "Entre 30 y 100", traspaso: TOQUES.traspaso } }), false);
  assert.equal(seccionCompleta(s, { cierre: {} }), false);
});

// Control positivo: la forma exacta de lo que una clienta real guardó antes del
// 8-nov (datos ficticios; opciones tal cual, incluida «Sí, siempre» de Mercurio).
const COMO_LO_DEJO: Respuestas = {
  despacho: { nombreDespacho: "Despacho Ejemplo", responsable: "Ana Prueba", correo: "ana@ejemplo.com", telefono: "+34 600 000 000", municipio: "basauri", oficinas: ["Bizkaia", "Otra provincia", "Araba", "Gipuzkoa"], otrasOficinas: "" },
  usuarios: [{ nombre: "Luis Prueba", correo: "luis@ejemplo.com", funcion: "Abogada o abogado", economia: "No" }],
  tramites: [{ tramite: "Renovación de residencia", volumen: "De 3 a 5", documentos: "pasaporte completo", honorarios: "230 € con IVA" }],
  trabajo: { dondeHoy: ["Otro programa"], programa: "", mercurio: "Sí, siempre", contencioso: "No", urgentes: "No", canales: ["WhatsApp", "Correo"], idiomas: ["Español"] },
  plantillas: { faltan: "La designación la rellena el otro abogado" },
};

test("SeiriLegal · lo que ya respondió cuenta: 4 de 5 secciones completas y solo falta «Para terminar»", () => {
  const { completas, porcentaje } = avance(COMO_LO_DEJO, SECCIONES_SEIRILEGAL);
  assert.deepEqual(completas, ["despacho", "usuarios", "tramites", "trabajo"]);
  assert.equal(porcentaje, 80);
  assert.equal(SECCIONES_SEIRILEGAL.length, 5);
  assert.equal(avance({ ...COMO_LO_DEJO, cierre: TOQUES }, SECCIONES_SEIRILEGAL).porcentaje, 100, "con cuatro toques queda al 100 %");
});

test("SeiriLegal · lo respondido en preguntas quitadas sigue a la vista en el panel", () => {
  const a = respuestasAnteriores(COMO_LO_DEJO, SECCIONES_SEIRILEGAL);
  assert.deepEqual(a, [{ seccion: "plantillas", campo: "faltan", indice: undefined, valor: "La designación la rellena el otro abogado" }]);
  assert.equal(plantillaDe("seirilegal").anteriores?.["plantillas.faltan"], "¿Alguna que hagas a mano?");
});

test("envío a medias: SeiriLegal sí, ServiNomic no", () => {
  assert.equal(plantillaDe("seirilegal").envioLibre, true);
  assert.ok(!plantillaDe("servinomic").envioLibre);
});

test("SeiriLegal · trámites: se marcan todos de una vez y cada uno nace con sus documentos ya marcados", () => {
  const s = legal("tramites");
  assert.equal(s.item?.elegir?.campo, "tramite");
  assert.ok(!s.campos.some((c) => c.id === "formulario"), "«Formulario y tasa» ya no se pregunta: lo fija la norma");
  const { items } = aplicarEleccion([], ["Arraigo sociolaboral", "Renovación de residencia"], "tramite", s.item!.elegir!.alElegir);
  assert.deepEqual(elegidos(items, "tramite"), ["Arraigo sociolaboral", "Renovación de residencia"]);
  const docs = items[1]["docs-renovacion-de-residencia"] as string[];
  assert.ok(docs.includes("Vida laboral") && !docs.some((d) => d.startsWith("Formulario")), "lo que trae el cliente va marcado; el formulario, no");
  // Lo ya marcado es válido y sobrevive a la limpieza del servidor.
  assert.deepEqual(limpiarSeccion(s, items), items);
  // Solo falta un toque por trámite: cuántos al mes.
  assert.equal(seccionCompleta(s, { tramites: items }), false);
  assert.equal(seccionCompleta(s, { tramites: items.map((it) => ({ ...it, volumen: "1 o 2" })) }), true);
});

test("SeiriLegal · trámites: desmarcar aparta lo llenado y volver a marcar lo recupera; lo de antes no se toca", () => {
  const alElegir = legal("tramites").item!.elegir!.alElegir;
  const antes = COMO_LO_DEJO.tramites as Valores[];
  const r1 = aplicarEleccion(antes, ["Renovación de residencia", "Arraigo social"], "tramite", alElegir);
  assert.equal(r1.items[0], antes[0], "lo que ya respondió queda tal cual, sin documentos añadidos");
  const llenado = { ...r1.items[1], volumen: "De 6 a 10", honorarios: "300 €" };
  const r2 = aplicarEleccion([r1.items[0], llenado], ["Renovación de residencia"], "tramite", alElegir);
  assert.equal(r2.items.length, 1);
  const r3 = aplicarEleccion(r2.items, ["Renovación de residencia", "Arraigo social"], "tramite", alElegir, r2.apartados);
  assert.deepEqual(r3.items[1], llenado, "vuelve con lo que ya había escrito");
  assert.deepEqual(r3.apartados, {});
});

test("SeiriLegal · Google Drive como opción donde se apuntan los casos y para pasar los expedientes", () => {
  assert.ok(legal("trabajo").campos.find((c) => c.id === "dondeHoy")!.opciones!.includes("Google Drive"));
  assert.ok(legal("cierre").campos.find((c) => c.id === "traspaso")!.opciones!.some((o) => o.includes("Google Drive")));
});

test("SeiriLegal · lo respondido en «Formulario y tasa» sigue a la vista en el panel", () => {
  const conFormulario: Respuestas = { ...COMO_LO_DEJO, tramites: [{ ...(COMO_LO_DEJO.tramites as Valores[])[0], formulario: "EX-10 y tasa 790-052" }] };
  const a = respuestasAnteriores(conFormulario, SECCIONES_SEIRILEGAL);
  assert.ok(a.some((x) => x.seccion === "tramites" && x.campo === "formulario" && x.indice === 1 && x.valor === "EX-10 y tasa 790-052"));
  assert.equal(plantillaDe("seirilegal").anteriores?.["tramites.formulario"], "Formulario y tasa");
  assert.deepEqual(avance(conFormulario, SECCIONES_SEIRILEGAL).completas, ["despacho", "usuarios", "tramites", "trabajo"]);
});

test("SeiriLegal · trámites nuevos: circunstancias excepcionales, modificación y paso a ordinaria tras la regularización", () => {
  const s = legal("tramites");
  const opciones = s.campos.find((c) => c.id === "tramite")!.opciones!;
  const nuevos = ["Circunstancias excepcionales (razones humanitarias, víctimas…)", "Modificación de residencia", "Regularización 2026: paso a autorización ordinaria"];
  for (const t of nuevos) assert.ok(opciones.includes(t), t);
  assert.equal(opciones.at(-1), "Otro");
  const { items } = aplicarEleccion([], nuevos, "tramite", s.item!.elegir!.alElegir);
  for (const it of items) assert.ok(Object.keys(it).some((k) => k.startsWith("docs-") && (it[k] as string[]).length > 0), `${it.tramite} nace con documentos`);
  assert.equal(seccionCompleta(s, { tramites: items.map((it) => ({ ...it, volumen: "1 o 2" })) }), true);
});
