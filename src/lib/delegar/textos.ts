/**
 * Textos que deben decir lo mismo en toda la landing «delegar».
 *
 * Cada uno vive aquí una sola vez: si el botón dijera una cosa arriba y otra
 * abajo, o el plazo de respuesta cambiara entre el hero y la confirmación, la
 * persona no sabría a cuál creer.
 */

/** Todos los CTA de entrada. Los botones internos del formulario tienen los suyos. */
export const CTA_DELEGAR = "Agendar consulta gratuita";

/**
 * Plazo de respuesta. `null` mientras no esté confirmado que se puede cumplir
 * durante la campaña: sin plazo, la página no promete ninguno. Cuando se
 * defina, se escribe aquí y aparece en «Qué pasa después» y en la confirmación.
 */
export const PLAZO_RESPUESTA: string | null = null;

export const REVISION_GRATIS = "La revisión inicial es gratuita. Cualquier implementación se cotiza aparte.";
