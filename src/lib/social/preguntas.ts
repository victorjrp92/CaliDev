/**
 * Preguntas para Jev (TypeSafe), portadas de ig-agente/preguntas.py, donde se
 * midieron: 47/48 en comentarios de verdad conocida y ningún error por encima
 * del umbral 0,7.
 *
 * Los tipos se definen por lo que hay que HACER con el comentario, no por su
 * sentimiento: filtrar por sentimiento mezcla casos que se tratan distinto
 * (lección del proyecto del hotel).
 */

export const TIPOS = {
  felicitacion:
    "Felicita, agradece, bendice, desea éxitos o celebra el video, a Victor, a Calidev o a la dueña del negocio. Sin pedir nada.",
  quiere_contacto:
    "Quiere hablar con Victor o Calidev, pide información, escribe la palabra ayuda o info, pregunta cómo contactarlos, cuánto cuesta o si esto le sirve para su propio negocio.",
  limpiaexpress:
    "Se refiere al servicio de limpieza de LimpiaExpress: quiere contratar aseo o limpieza, pregunta precios de limpieza, pregunta si llegan o atienden en una ciudad, barrio o zona, o busca empleo o quiere trabajar con ellos (Calidev trabaja remoto y no contrata personal, así que empleo y cobertura siempre son de LimpiaExpress).",
  etiqueta_emoji:
    "Solo etiqueta a otra persona con @, o solo pone emojis o una o dos palabras sueltas sin mensaje claro.",
  critica:
    "Expresa desacuerdo, duda o una crítica con argumentos sobre el video, la tecnología o el servicio, sin insultar.",
  ofensa_spam:
    "Insulta, usa groserías contra alguien, o es spam: promociona otra cuenta, pide seguidores, ofrece dinero fácil o trae enlaces sospechosos.",
} as const;

/** Contexto con el que se midió la versión 47/48. */
export const CONTEXTO_DEISY =
  "El video es de una clienta (dueña de la empresa de limpieza LimpiaExpress) recomendando a Victor y a su empresa Calidev, que digitaliza y ordena negocios.";

/**
 * El contexto cambia por publicación (lo escribe Victor en la automatización);
 * las definiciones de los tipos no.
 */
export function preguntasComentario(contexto: string | null) {
  return {
    tipo: {
      type: "choice",
      instructions: `Qué tipo de comentario es, según lo que habría que responderle. ${contexto ?? CONTEXTO_DEISY}`,
      criteria: TIPOS,
    },
  };
}

export const RAMAS_DM = {
  negocio: "Cuenta que tiene un negocio, emprendimiento o empresa, o pide ayuda para su negocio.",
  limpiaexpress: "Busca el servicio de limpieza de LimpiaExpress o trabajo en LimpiaExpress.",
  otro: "Cualquier otra cosa: saludo, duda general, algo que no es un negocio ni LimpiaExpress.",
} as const;

export const PREGUNTAS_DM = {
  rama: {
    type: "choice",
    instructions: "Qué busca la persona con este mensaje directo",
    criteria: RAMAS_DM,
  },
};
