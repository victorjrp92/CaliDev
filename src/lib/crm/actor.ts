import type { TipoUsuario } from "./permisos";

/** Quién hace una petición al CRM y por dónde entró. Lo produce el guardia y lo usa la auditoría. */
export type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  tipo: TipoUsuario;
  rol: string;
  activo: boolean;
};

export type Origen = "ui" | "cli" | "agente" | "sistema";

export type Actor = {
  usuario: Usuario;
  origen: Origen;
  /** Alcances de la clave con la que entró; null si es una sesión humana del navegador. */
  alcances: string[] | null;
  claveId: number | null;
};

/** Error con forma de API: `{ error: { codigo, mensaje, campo? } }`. El mensaje dice cómo arreglarlo. */
export class ErrorCrm extends Error {
  constructor(
    public estado: number,
    public codigo: string,
    mensaje: string,
    public campo?: string,
  ) {
    super(mensaje);
  }
}
