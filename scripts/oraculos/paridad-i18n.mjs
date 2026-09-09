/**
 * Paridad de claves entre los tres idiomas.
 *
 * Caza las dos formas de hueco: la clave que falta en un idioma y la que está
 * pero vacía. La segunda es la peligrosa, porque compila, renderiza y no se ve
 * hasta que alguien abre la página en alemán.
 */
import { readFileSync } from "node:fs";

const IDIOMAS = ["es", "en", "de"];
const cargar = (l) => JSON.parse(readFileSync(`messages/${l}.json`, "utf8"));

const aplanar = (obj, prefijo = "", salida = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const clave = prefijo ? `${prefijo}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) aplanar(v, clave, salida);
    else salida[clave] = v;
  }
  return salida;
};

const planos = Object.fromEntries(IDIOMAS.map((l) => [l, aplanar(cargar(l))]));
const todas = new Set(IDIOMAS.flatMap((l) => Object.keys(planos[l])));

let fallos = 0;
for (const clave of [...todas].sort()) {
  for (const l of IDIOMAS) {
    const v = planos[l][clave];
    if (v === undefined) { console.log(`FALTA  ${l}  ${clave}`); fallos++; }
    else if (typeof v === "string" && v.trim() === "") { console.log(`VACÍA  ${l}  ${clave}`); fallos++; }
  }
}

console.log(fallos ? `\n${fallos} hueco(s) en ${todas.size} claves` : `\n${todas.size} claves, paridad completa en ${IDIOMAS.join("/")}`);
process.exit(fallos ? 1 : 0);
