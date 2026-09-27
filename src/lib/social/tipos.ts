/**
 * Tipos compartidos del agente de Instagram. Sin dependencias: lo importan
 * tanto la lógica pura (con pruebas) como las rutas y las páginas.
 */

export type TipoComentario =
  | "felicitacion"
  | "quiere_contacto"
  | "limpiaexpress"
  | "etiqueta_emoji"
  | "critica"
  | "ofensa_spam";

export type RamaDm = "negocio" | "limpiaexpress" | "otro";

/** Qué hace el agente con un comentario ya clasificado. */
export type Accion = "ia" | "contacto" | "fijo_aliado" | "fijo_critica" | "ignorar" | "revision";

export type Modo = "automatico" | "borradores" | "apagado";

export type Paso = "esperando_boton" | "esperando_texto" | "asesoria_enviada" | "enviado_aliado" | "revision";

export type Boton = "si" | "no" | "aliado";

export interface Tarjeta {
  titulo: string;
  subtitulo: string;
  boton: string;
  url: string;
}

/** Todo lo que Victor puede editar de una automatización. */
export interface Textos {
  pregunta: string;
  si: string;
  no: string;
  aliado: string;
  botonSi: string;
  botonNo: string;
  botonAliado: string;
  pubContacto: string[];
  pubAliado: string[];
  pubCritica: string[];
  tarjetaSi: Omit<Tarjeta, "url">;
  tarjetaAliado: Tarjeta;
}

export interface Automatizacion {
  mediaId: string;
  modo: Modo;
  sensible: boolean;
  activadoEn: string | null;
  landingUrl: string | null;
  palabrasClave: string[];
  detectarInteres: boolean;
  umbral: number;
  contexto: string | null;
  textos: Textos;
}
