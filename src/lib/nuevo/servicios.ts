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

export type Servicio = {
  n: string;
  linea: string;
  titulo: string;
  cuerpo: string;
  puntos: string[];
  /** Fondo y texto del panel. Pares con contraste verificado. */
  fondo: string;
  texto: string;
  /** Color del cintillo y las viñetas dentro del panel. */
  realce: string;
  visual: Visual;
  /** Texto alternativo del visual. */
  visualAlt: string;
};

export const SERVICIOS: Servicio[] = [
  {
    n: "01",
    linea: "Estrategia digital",
    titulo: "Empezamos por tu operación, no por el código.",
    cuerpo:
      "La mayoría de agencias abre un editor. Nosotros abrimos tus números primero, porque construir lo que no necesitas sale más caro que no construir nada.",
    puntos: [
      "Encontramos dónde se te va el dinero antes de tocar nada",
      "Un plan con impacto estimado, tiempos y costos reales",
      "Si no nos necesitas, te lo decimos",
    ],
    fondo: "#0A3D2E",
    texto: "#FAFAF7",
    realce: "#C8F045",
    visual: { tipo: "clip", src: "/nuevo/clips/estrategia.mp4", poster: "/nuevo/clips/estrategia.jpg" },
    visualAlt: "Una mano anotando sobre un informe impreso con gráficas, junto a un café",  },
  {
    n: "02",
    linea: "Páginas web",
    titulo: "Un sitio que actualizas tú, desde el celular.",
    cuerpo:
      "Con un editor propio tan simple que si publicas una historia, puedes cambiar tu página. Sin llamar a nadie y sin esperar a que alguien tenga tiempo.",
    puntos: [
      "Cambias textos, fotos y precios sin programador",
      "Multilingüe y optimizado para que te encuentren",
      "Es tuyo: sin suscripciones ni ataduras",
    ],
    fondo: "#E6E8E3",
    texto: "#14201B",
    realce: "#0A3D2E",
    visual: { tipo: "clip", src: "/nuevo/clips/imac.mp4", poster: "/nuevo/clips/imac.jpg" },
    visualAlt: "Una persona construyendo una página web en el computador",  },
  {
    n: "03",
    linea: "Apps y CRMs",
    titulo: "Cuando el negocio supera las hojas de cálculo.",
    cuerpo:
      "Llega un punto en que el Excel deja de ayudar y empieza a esconder. Ahí es cuando hace falta un sistema hecho para cómo trabajas tú, no al revés.",
    puntos: [
      "Construido sobre tu operación real, no sobre una plantilla",
      "Web y móvil a la vez, con los mismos datos",
      "Tus datos, tu plataforma, tus reglas",
    ],
    fondo: "#0F2233",
    texto: "#E6E8E3",
    realce: "#C8F045",
    visual: { tipo: "productos", fondo: "/nuevo/shots/seiricon.webp" },
    visualAlt: "Seiricon y ServiNomic, dos sistemas que construimos",  },
  {
    n: "04",
    linea: "Automatizaciones",
    titulo: "Lo que tu equipo hace a mano, hecho solo.",
    cuerpo:
      "Cuadrar pagos, pasar datos de un lado a otro, armar el reporte del lunes. Trabajo que no requiere criterio y que se lleva las horas que sí lo requieren.",
    puntos: [
      "Conectamos las herramientas que ya usas",
      "El reporte llega sin que nadie lo pida",
      "En LimpiaExpress fueron más de 20 horas por semana",
    ],
    fondo: "#C8F045",
    texto: "#14201B",
    realce: "#0A3D2E",
    visual: { tipo: "workflow" },
    visualAlt: "Un flujo automático que se enciende paso a paso",  },
];
