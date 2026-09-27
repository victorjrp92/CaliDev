import * as ig from "./instagram";
import type { Tarjeta } from "./tipos";

/**
 * Toda escritura hacia Instagram pasa por aquí. Dos frenos:
 * - Tope por ejecución: en Vercel Hobby cada ejecución es corta, y además
 *   repartir las respuestas entre minutos las espacia (Instagram penaliza
 *   ráfagas de respuestas). Por eso aquí no hay `sleep`.
 * - Simulación: decide y registra, pero no publica.
 */
export const TOPE_POR_EJECUCION = 6;

export class Acciones {
  hechas = 0;
  constructor(readonly simulacion: boolean) {}

  /** ¿Caben `n` acciones más? Un comentario puede gastar 2 (pública + privada). */
  caben(n: number) {
    return this.hechas + n <= TOPE_POR_EJECUCION;
  }

  private async ejecutar<T>(fn: () => Promise<T>): Promise<T | { simulado: true }> {
    this.hechas++;
    if (this.simulacion) return { simulado: true };
    return fn();
  }

  responderComentario(id: string, texto: string) {
    return this.ejecutar(() => ig.responderComentario(id, texto));
  }
  respuestaPrivada(id: string, texto: string, botones: string[]) {
    return this.ejecutar(() => ig.respuestaPrivada(id, texto, botones));
  }
  enviarTexto(igsid: string, texto: string) {
    return this.ejecutar(() => ig.enviarTexto(igsid, texto));
  }
  enviarTarjeta(igsid: string, t: Tarjeta) {
    return this.ejecutar(() => ig.enviarTarjeta(igsid, t));
  }
}
