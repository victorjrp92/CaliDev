/**
 * Contraste WCAG de los pares que el sitio usa de verdad.
 *
 * El caso que motiva este oráculo es la barra: es un velo translúcido sobre
 * fondos que cambian panel a panel, así que su contraste real no se puede leer
 * de una hoja de estilos — hay que componer el velo sobre cada fondo y medir
 * encima. Un fondo nuevo en la paleta entra aquí o no está verificado.
 */
import { PALETA as P, CRISTAL, componer, ratio } from "./paleta.mjs";

const AA = 4.5;
const AA_GRANDE = 3.0;

const pares = [
  // Texto normal sobre cada fondo del sitio.
  ["hueso sobre verde", P.hueso, P.verde, AA],
  ["hueso sobre azul", P.hueso, P.azul, AA],
  ["hueso sobre verde hondo", P.hueso, P.verdeHondo, AA],
  ["niebla sobre azul", P.niebla, P.azul, AA],
  ["tinta sobre hueso", P.tinta, P.hueso, AA],
  ["tinta sobre niebla", P.tinta, P.niebla, AA],
  ["tinta sobre lima", P.tinta, P.lima, AA],
  ["verde sobre hueso", P.verde, P.hueso, AA],
  ["verde sobre niebla", P.verde, P.niebla, AA],
  // Acentos: lima solo sobre oscuro.
  ["lima sobre verde", P.lima, P.verde, AA],
  ["lima sobre azul", P.lima, P.azul, AA],
  ["lima sobre verde hondo", P.lima, P.verdeHondo, AA],
  // Botón invertido del panel de cierre.
  ["lima sobre tinta", P.lima, P.tinta, AA],
];

// La barra, compuesta sobre cada fondo por el que pasa.
for (const [nombre, fondo] of Object.entries(P)) {
  const compuesto = componer(CRISTAL.color, CRISTAL.alpha, fondo);
  pares.push([`hueso sobre barra encima de ${nombre}`, P.hueso, compuesto, AA]);
  pares.push([`lima sobre barra encima de ${nombre}`, P.lima, compuesto, AA_GRANDE]);
}

let fallos = 0;
for (const [nombre, fg, bg, minimo] of pares) {
  const r = ratio(fg, bg);
  const ok = r >= minimo;
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${r.toFixed(2).padStart(6)}:1  (min ${minimo})  ${nombre}`);
}

console.log(fallos ? `\n${fallos} par(es) por debajo del mínimo` : `\n${pares.length} pares, todos pasan`);
process.exit(fallos ? 1 : 0);
