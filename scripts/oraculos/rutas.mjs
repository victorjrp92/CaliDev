/** Rutas públicas que los oráculos recorren. `/nuevo` sale cuando redirija. */
export const IDIOMAS = ["es", "en", "de"];
export const PAGINAS = ["", "/about", "/blog", "/contact", "/services"];
export const BASE = process.env.BASE ?? "http://localhost:3000";
export const rutas = (idiomas = IDIOMAS) =>
  idiomas.flatMap((l) => PAGINAS.map((p) => `/${l}${p}`));
