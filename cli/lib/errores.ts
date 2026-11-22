/**
 * Códigos de salida del CLI (spec §7): 0 ok · 2 error de uso · 3 sin permiso ·
 * 4 quedó pendiente de aprobación · 1 cualquier otro. Un agente decide qué
 * hacer leyendo solo el código, sin parsear el mensaje.
 */
export const SALIDA = { ok: 0, otro: 1, uso: 2, sinPermiso: 3, pendiente: 4 } as const;

export class ErrorCli extends Error {
  salida: number;
  codigo: string;
  campo: string | null;
  constructor(salida: number, codigo: string, mensaje: string, campo: string | null = null) {
    super(mensaje);
    this.salida = salida;
    this.codigo = codigo;
    this.campo = campo;
  }
}

/** Error de uso: falta un argumento o sobra uno. */
export const errorUso = (mensaje: string, campo: string | null = null) => new ErrorCli(SALIDA.uso, "uso", mensaje, campo);
