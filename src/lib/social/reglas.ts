import type { Accion, Boton, Modo, Paso, TipoComentario } from "./tipos";

const H = 3600_000;

export function decidir(
  tipo: TipoComentario, confianza: number,
  c: { modo: Modo; sensible: boolean; umbral: number; detectarInteres: boolean },
): Accion {
  if (tipo === "ofensa_spam" && confianza >= c.umbral) return "ignorar";
  if (confianza < c.umbral || c.modo === "borradores" || c.sensible) return "revision";
  const mapa: Record<TipoComentario, Accion> = {
    felicitacion: "ia", etiqueta_emoji: "ia", quiere_contacto: "contacto",
    limpiaexpress: "fijo_aliado", critica: "fijo_critica", ofensa_spam: "ignorar",
  };
  return mapa[tipo];
}

export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()
    .replace(/^[\s¡¿!?.]+|[\s¡¿!?.]+$/g, "").replace(/\s+/g, " ");
}

export function reconocerBoton(
  texto: string, t: { botonSi: string; botonNo: string; botonAliado: string },
): Boton | null {
  const n = normalizar(texto);
  const si = new Set([normalizar(t.botonSi), "si", "sip", "claro", "si tengo", "si tengo negocio"]);
  const no = new Set([normalizar(t.botonNo), "no", "nop", "no tengo"]);
  const aliadoBase = normalizar(t.botonAliado).replace(/^busco /, "");
  const aliado = new Set([normalizar(t.botonAliado), aliadoBase, aliadoBase.replace(/\s/g, ""), "limpia express"]);
  if (si.has(n)) return "si";
  if (no.has(n)) return "no";
  if (aliado.has(n) || aliado.has(n.replace(/\s/g, ""))) return "aliado";
  return null;
}

/** ms hasta la próxima revisión; null = apagar la automatización. */
export function siguienteRevision(msDesdeActivacion: number): number | null {
  if (msDesdeActivacion < 72 * H) return 60_000;
  if (msDesdeActivacion < 14 * 24 * H) return 15 * 60_000;
  return null;
}

export const fechaIg = (ts: string) => Date.parse(ts.replace(/\+0000$/, "Z"));

export function puedeRespuestaPrivada(tsComentario: string, ahora = Date.now()): boolean {
  return ahora - fechaIg(tsComentario) < 7 * 24 * H;
}

export function ventanaAbierta(tsUltimoDeElla: string, ahora = Date.now()): boolean {
  return ahora - fechaIg(tsUltimoDeElla) < 24 * H;
}

/** ¿El texto contiene alguna palabra clave (ignorando mayúsculas, tildes y signos)? */
export function contieneClave(texto: string, claves: string[]): boolean {
  const palabras = new Set(normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean));
  return claves.some((c) => palabras.has(normalizar(c)));
}

/**
 * Con la detección de interés apagada, solo quien escribe la palabra clave
 * recibe mensaje privado; el resto de interesados recibe un agradecimiento.
 * Con la detección encendida, la clave también cuenta aunque Jev dude.
 */
export function accionFinal(
  accion: Accion, texto: string, c: { palabrasClave: string[]; detectarInteres: boolean },
): Accion {
  const tieneClave = contieneClave(texto, c.palabrasClave);
  if (accion === "contacto" && !c.detectarInteres && !tieneClave) return "ia";
  if (accion === "revision" && tieneClave && normalizar(texto).split(" ").length <= 3) return "contacto";
  return accion;
}

/**
 * ¿Se le abre conversación por mensaje directo a quien comentó?
 *
 * Una vez por persona Y POR PUBLICACIÓN: un seguidor que ya comentó otro video
 * debe volver a recibirlo, porque cada publicación tiene su propia landing. Lo
 * que no se repite es el mensaje a quien ya entró por ESTA misma publicación,
 * por muchas veces que comente en ella.
 *
 * Excepción: si Victor pausó a esa persona (paso "revision"), el agente no la
 * toca; su conversación la lleva él.
 */
export function debeAbrirConversacion(yaEntroPorEstaPublicacion: boolean, pasoActual: Paso | null): boolean {
  if (yaEntroPorEstaPublicacion) return false;
  if (pasoActual === "revision") return false;
  return true;
}
