import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";

/**
 * Las tres voces del sitio.
 *
 * Vollkorn en los titulares, B612 en el texto y IBM Plex Mono en las etiquetas.
 * Vollkorn y B612 se sirven desde nuestro propio dominio —los archivos están en
 * esta carpeta— y no desde Google: son de la carpeta de fuentes del proyecto,
 * están bajo licencia SIL OFL y así no dependemos de un tercero para pintar el
 * texto. Los cortes vienen recortados a latino y en woff2: Vollkorn pasó de
 * 337 KB a 39 KB por peso.
 *
 * La mono sigue viniendo de Google porque ninguna de las dos locales lo es, y
 * las etiquetas y los relojes del hero necesitan que las cifras ocupen todas lo
 * mismo. Sin eso los segundos bailan al pasar.
 */

/** Titulares. El 800 es el peso de los grandes; el 600 para los de tercer nivel. */
export const vollkorn = localFont({
  src: [
    { path: "./vollkorn-400.woff2", weight: "400", style: "normal" },
    { path: "./vollkorn-italic-400.woff2", weight: "400", style: "italic" },
    { path: "./vollkorn-600.woff2", weight: "600", style: "normal" },
    { path: "./vollkorn-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-titular",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** Texto corrido. Diseñada por Airbus para pantallas de cabina: formas abiertas. */
export const b612 = localFont({
  src: [
    { path: "./b612-400.woff2", weight: "400", style: "normal" },
    { path: "./b612-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cuerpo",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

/** Etiquetas, relojes y cifras: todo lo que necesita ancho fijo. */
export const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500"],
  display: "swap",
});

export const variablesDeFuente = `${vollkorn.variable} ${b612.variable} ${plex.variable}`;
