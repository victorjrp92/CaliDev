/**
 * El grafo del workflow que se anima en el panel de automatizaciones.
 *
 * Es un flujo real de los que construimos, no un adorno: entra una reserva,
 * se ramifica en las dos cosas que pasan a la vez (asignar a alguien y cobrar),
 * y vuelven a converger en el reporte. Cada nodo declara de quién depende, y
 * la animación se deriva de eso — no hay tiempos escritos a mano.
 *
 * Las etiquetas van DEBAJO de cada nodo, no dentro: caben enteras y el nodo
 * queda como forma limpia, que es como se lee un diagrama de flujo.
 *
 * Ojo con los tonos: este grafo vive sobre el panel lima, así que ningún nodo
 * puede ser lima — desaparecería contra el fondo.
 *
 * Coordenadas en un lienzo de 100 × 62 para que el SVG escale solo.
 */
export type Nodo = {
  id: string;
  /** La etiqueta va en dos líneas: centrada bajo un nodo, en una sola se
   *  pisaría con la del nodo vecino. Se declara partida, no se adivina. */
  x: number;
  y: number;
  /** Nodos que deben encenderse antes que este. */
  de: string[];
  /** `entrada` y `salida` se dibujan como círculos; el resto, como tarjetas. */
  forma: "entrada" | "paso" | "salida";
  tono: "verde" | "tinta" | "azul" | "hueso";
};

export const NODOS: Nodo[] = [
  { id: "reserva", x: 14, y: 28, de: [], forma: "entrada", tono: "tinta" },
  { id: "asigna", x: 37, y: 13, de: ["reserva"], forma: "paso", tono: "hueso" },
  { id: "cobro", x: 37, y: 43, de: ["reserva"], forma: "paso", tono: "azul" },
  { id: "ruta", x: 62, y: 13, de: ["asigna"], forma: "paso", tono: "hueso" },
  { id: "nomina", x: 62, y: 43, de: ["cobro"], forma: "paso", tono: "azul" },
  { id: "reporte", x: 86, y: 28, de: ["ruta", "nomina"], forma: "salida", tono: "verde" },
];

/** Radio o media caja de cada forma, en unidades del lienzo. */
export const MEDIDA = { entrada: 5, paso: 5.5, salida: 6 } as const;

/**
 * Profundidad de cada nodo en el grafo. Los que están al mismo nivel se
 * encienden a la vez — que es justo lo que hay que ver: dos cosas pasando
 * en paralelo sin que nadie las empuje.
 */
export function nivelDe(id: string, nodos: Nodo[] = NODOS): number {
  const nodo = nodos.find((n) => n.id === id);
  if (!nodo || nodo.de.length === 0) return 0;
  return 1 + Math.max(...nodo.de.map((padre) => nivelDe(padre, nodos)));
}

export type Arista = { de: Nodo; a: Nodo; d: string; nivel: number };

/**
 * Aristas ortogonales redondeadas: salen por el borde derecho del nodo padre,
 * giran una vez a mitad de camino y entran por el borde izquierdo del hijo.
 * Arrancan en el borde y no en el centro para que la línea no se dibuje por
 * debajo de la forma.
 */
export function aristas(nodos: Nodo[] = NODOS): Arista[] {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const salida: Arista[] = [];

  for (const a of nodos) {
    for (const padreId of a.de) {
      const de = porId.get(padreId);
      if (!de) continue;

      const x1 = de.x + MEDIDA[de.forma];
      const x2 = a.x - MEDIDA[a.forma];
      const r = 3;
      const mx = (x1 + x2) / 2;
      let d: string;

      if (Math.abs(de.y - a.y) < 0.5) {
        d = `M ${x1} ${de.y} L ${x2} ${a.y}`;
      } else {
        const s = a.y > de.y ? 1 : -1;
        d =
          `M ${x1} ${de.y} L ${mx - r} ${de.y} ` +
          `Q ${mx} ${de.y} ${mx} ${de.y + s * r} ` +
          `L ${mx} ${a.y - s * r} ` +
          `Q ${mx} ${a.y} ${mx + r} ${a.y} ` +
          `L ${x2} ${a.y}`;
      }
      salida.push({ de, a, d, nivel: nivelDe(a.id, nodos) });
    }
  }
  return salida;
}

/** Cuántos pasos tiene la cadena completa. */
export const PROFUNDIDAD = Math.max(...NODOS.map((n) => nivelDe(n.id)));
