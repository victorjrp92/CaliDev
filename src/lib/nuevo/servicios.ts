/**
 * Los cuatro servicios, en el orden en que los vendemos: primero el análisis,
 * después lo que se construye. Cada panel trae su propio par de colores de la
 * paleta SEÑAL — el lima solo aparece una vez, en el último, para que llegue
 * como remate y no como ruido.
 */
/**
 * Los clips son recortes del vídeo del hero: misma escena, misma luz, cero
 * créditos. Las imágenes son capturas en vivo de sitios que construimos —
 * son prueba, no decoración, así que solo van donde el trabajo es público.
 */
export type Visual =
  | { tipo: "clip"; src: string; poster: string }
  | { tipo: "imagen"; src: string }
  /** Dos productos en capas: la captura en vivo detrás, la recreación delante. */
  | { tipo: "productos"; fondo: string }
  /** El grafo animado en SVG, que reacciona al clic. */
  | { tipo: "workflow" };

/**
 * Solo lo que NO se traduce.
 *
 * El texto —línea, titular, cuerpo, puntos y alternativo— vive en `messages`
 * bajo `senal.servicios.s01`…`s04` y se busca por `n`. Aquí quedan los colores,
 * el tipo de visual y sus rutas, que son iguales en los tres idiomas: tenerlos
 * duplicados en cada traducción sería pedir que se desincronicen.
 */
export type Servicio = {
  /** «01»…«04». Es también la clave de traducción del panel. */
  n: string;
  /** Fondo y texto del panel. Pares con contraste verificado. */
  fondo: string;
  texto: string;
  /** Color del cintillo y las viñetas dentro del panel. */
  realce: string;
  visual: Visual;
};

export const SERVICIOS: Servicio[] = [
  {
    n: "01",
    fondo: "#0A3D2E",
    texto: "#FAFAF7",
    realce: "#C8F045",
    visual: { tipo: "clip", src: "/nuevo/clips/estrategia.mp4", poster: "/nuevo/clips/estrategia.jpg" },  },
  {
    n: "02",
    fondo: "#E6E8E3",
    texto: "#14201B",
    realce: "#0A3D2E",
    visual: { tipo: "clip", src: "/nuevo/clips/imac.mp4", poster: "/nuevo/clips/imac.jpg" },  },
  {
    n: "03",
    fondo: "#0F2233",
    texto: "#E6E8E3",
    realce: "#C8F045",
    visual: { tipo: "productos", fondo: "/nuevo/shots/seiricon.webp" },  },
  {
    n: "04",
    fondo: "#C8F045",
    texto: "#14201B",
    realce: "#0A3D2E",
    visual: { tipo: "workflow" },  },
];
