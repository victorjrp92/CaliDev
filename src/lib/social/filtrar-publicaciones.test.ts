import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarPublicaciones } from "./filtrar-publicaciones";
import type { FilaPublicacion } from "./consultas";

const f = (x: Partial<FilaPublicacion>): FilaPublicacion => ({
  mediaId: "1", titulo: "t", permalink: null, miniatura: null, tipo: "REELS", publicado: "", modo: null, sensible: false,
  landing: null, vistas: null, comentarios: 0, interesados: 0, leads: 0, revision: 0, enPerfil: true, ...x,
});
const filas = [
  f({ mediaId: "a", modo: "automatico", landing: "x" }), f({ mediaId: "b", enPerfil: false }),
  f({ mediaId: "c", tipo: "FEED", revision: 2 }), f({ mediaId: "d", modo: "apagado" }),
];
const ids = (r: FilaPublicacion[]) => r.map((x) => x.mediaId).join("");

test("filtros de publicaciones", () => {
  assert.equal(ids(filtrarPublicaciones(filas, "todas")), "abcd");
  assert.equal(ids(filtrarPublicaciones(filas, "automatizadas")), "a");
  assert.equal(ids(filtrarPublicaciones(filas, "landing")), "a");
  assert.equal(ids(filtrarPublicaciones(filas, "reels")), "ad");
  assert.equal(ids(filtrarPublicaciones(filas, "pruebas")), "b");
  assert.equal(ids(filtrarPublicaciones(filas, "posts")), "c");
  assert.equal(ids(filtrarPublicaciones(filas, "atender")), "c");
});
