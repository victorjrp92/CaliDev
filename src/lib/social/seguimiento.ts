/**
 * Reglas del mapa de calor propio, sin DOM para poder probarlas:
 * - clic muerto: sobre algo que no hace nada (ni enlace, ni botón, ni campo,
 *   ni dentro de uno de ellos).
 * - clic de rabia: 3 o más clics en ≤ 1 s dentro de un radio de 24 px.
 */
const INTERACTIVOS = new Set(["a", "button", "input", "select", "textarea", "label", "summary", "video"]);

export function esClicMuerto(cadena: { etiqueta: string; rol?: string | null; clicable?: boolean }[]): boolean {
  return !cadena.some((n) => INTERACTIVOS.has(n.etiqueta.toLowerCase()) || n.rol === "button" || n.rol === "link" || n.clicable);
}

export function detectorRabia(ventanaMs = 1000, radio = 24, minimo = 3) {
  const clics: { t: number; x: number; y: number }[] = [];
  return (t: number, x: number, y: number): boolean => {
    clics.push({ t, x, y });
    while (clics.length && t - clics[0].t > ventanaMs) clics.shift();
    const cerca = clics.filter((c) => Math.hypot(c.x - x, c.y - y) <= radio);
    return cerca.length >= minimo;
  };
}
