/**
 * El flujo del panel de automatizaciones, como tarjetas que se pueden mover.
 *
 * Es un flujo real de los que construimos, no un adorno: entra una reserva, se
 * ramifica en las dos cosas que pasan a la vez —asignar a alguien y facturar— y
 * las dos ramas vuelven a converger en el informe del lunes.
 *
 * Las coordenadas van en un lienzo fijo de 480 × 548 y el componente lo escala
 * al ancho que tenga. Se declaran a mano y no se calculan: la posición de cada
 * tarjeta dice algo —quién va antes, qué pasa en paralelo— y un reparto
 * automático lo perdería.
 *
 * Ojo con los tonos: este grafo vive sobre el panel lima, así que ninguna
 * tarjeta puede ser lima. El fondo de todas es hueso y el acento va en el chip
 * del icono, donde tiene contraste de sobra.
 */
export type Tipo = "disparador" | "accion" | "resultado";

export type Paso = {
  id: string;
  x: number;
  y: number;
  tipo: Tipo;
  /** Clave del icono en el mapa del componente. */
  icono: string;
  /** Color del chip. Nunca lima. */
  acento: string;
};

/** Lienzo de diseño. El componente escala a su contenedor. */
export const LIENZO = { ancho: 480, alto: 548 } as const;
/** Ancho de tarjeta y alto de reserva mientras no se ha medido la real. */
export const TARJETA = { ancho: 210, alto: 108 } as const;

const IZQ = 0;
const DER = 270;
const FILA = [0, 140, 280, 420] as const;

const VERDE = "#0A3D2E";
const AZUL = "#0F2233";
const TINTA = "#14201B";
const HONDO = "#072A20";

/** La cadena que se ve de entrada. */
export const PASOS: Paso[] = [
  { id: "reserva", x: IZQ, y: FILA[0], tipo: "disparador", icono: "calendario", acento: VERDE },
  { id: "asigna",  x: IZQ, y: FILA[1], tipo: "accion",     icono: "persona",    acento: AZUL },
  { id: "ruta",    x: IZQ, y: FILA[2], tipo: "accion",     icono: "ruta",       acento: AZUL },
  { id: "factura", x: DER, y: FILA[1], tipo: "accion",     icono: "recibo",     acento: TINTA },
  { id: "nomina",  x: DER, y: FILA[2], tipo: "accion",     icono: "monedas",    acento: TINTA },
  { id: "informe", x: IZQ, y: FILA[3], tipo: "resultado",  icono: "barras",     acento: HONDO },
];

export const ENLACES: [string, string][] = [
  ["reserva", "asigna"],
  ["asigna", "ruta"],
  ["reserva", "factura"],
  ["factura", "nomina"],
  ["ruta", "informe"],
  ["nomina", "informe"],
];

/**
 * Lo que añade el botón, en orden. Son dos y se acaban: son los dos huecos que
 * quedan libres sin que ninguna tarjeta se salga del lienzo, y en cuanto algo
 * se saliera habría que sacar una barra de scroll dentro de una página que ya
 * scrollea, que es justo lo que no queremos.
 *
 * No son pasos al azar —el componente del que sale la idea mete uno cualquiera
 * de una lista— sino dos cosas que pasan en cualquier negocio y que se
 * enganchan donde tienen sentido: `a` es el paso al que alimenta, `de` es el
 * paso del que cuelga.
 */
export type Extra = Paso & { de?: string; a?: string };

export const EXTRAS: Extra[] = [
  { id: "pedido", x: DER, y: FILA[0], tipo: "disparador", icono: "mensaje", acento: VERDE, a: "factura" },
  { id: "aviso",  x: DER, y: FILA[3], tipo: "accion",     icono: "tarjeta", acento: AZUL,  de: "ruta" },
];

/**
 * Une dos tarjetas eligiendo por qué lado sale la línea. Salir siempre por la
 * derecha da un rulo en cuanto dos tarjetas quedan una encima de otra, y
 * arrastrándolas eso pasa todo el rato.
 *
 * `alto` se pasa medido, no supuesto: en alemán los títulos ocupan una línea
 * más y las tarjetas crecen.
 */
export function curva(
  a: { x: number; y: number },
  b: { x: number; y: number },
  altoA: number,
  altoB: number,
  ancho = TARJETA.ancho
): string {
  const ca = { x: a.x + ancho / 2, y: a.y + altoA / 2 };
  const cb = { x: b.x + ancho / 2, y: b.y + altoB / 2 };
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    const t = dx > 0 ? 1 : -1;
    const x1 = a.x + (dx > 0 ? ancho : 0);
    const x2 = b.x + (dx > 0 ? 0 : ancho);
    const d = Math.max(34, Math.abs(x2 - x1) * 0.5);
    return `M${x1},${ca.y} C${x1 + d * t},${ca.y} ${x2 - d * t},${cb.y} ${x2},${cb.y}`;
  }

  const t = dy > 0 ? 1 : -1;
  const y1 = a.y + (dy > 0 ? altoA : 0);
  const y2 = b.y + (dy > 0 ? 0 : altoB);
  const d = Math.max(34, Math.abs(y2 - y1) * 0.5);
  return `M${ca.x},${y1} C${ca.x},${y1 + d * t} ${cb.x},${y2 - d * t} ${cb.x},${y2}`;
}

/** Todo lo que alcanza la cadena partiendo de un paso. */
export function alcanzables(desde: string, enlaces: [string, string][]): Set<string> {
  const vivos = new Set([desde]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const [de, a] of enlaces) {
      if (vivos.has(de) && !vivos.has(a)) {
        vivos.add(a);
        cambio = true;
      }
    }
  }
  return vivos;
}
