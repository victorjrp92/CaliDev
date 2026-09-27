import { landingPermitida } from "./enlaces";
import { TEXTOS_INICIALES } from "./textos";
import type { Modo, Textos } from "./tipos";

/**
 * Valida lo que llega del editor de automatizaciones antes de guardarlo. Los
 * límites son los de Meta (botones ≤ 20, respuestas ≤ 300) con margen.
 */
export interface EntradaAutomatizacion {
  modo: Modo; sensible: boolean; landingUrl: string | null; palabrasClave: string[];
  detectarInteres: boolean; umbral: number; contexto: string | null; textos: Textos;
}

const cad = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validarAutomatizacion(b: Record<string, unknown>): { ok: true; valor: EntradaAutomatizacion } | { ok: false; error: string } {
  const modo = b.modo;
  if (modo !== "automatico" && modo !== "borradores" && modo !== "apagado") return { ok: false, error: "Modo inválido" };
  const landing = typeof b.landingUrl === "string" && b.landingUrl.trim() ? b.landingUrl.trim() : null;
  if (landing && !landingPermitida(landing)) return { ok: false, error: "La landing debe ser https y de calidev.dev, seiricon.com o instagram.com" };
  const umbral = Number(b.umbral);
  if (!(umbral >= 0.5 && umbral <= 0.95)) return { ok: false, error: "El umbral va de 0,5 a 0,95" };
  const palabras = Array.isArray(b.palabrasClave)
    ? [...new Set(b.palabrasClave.map((p) => cad(p, 30).toLowerCase()).filter(Boolean))].slice(0, 10) : [];

  const t = (b.textos ?? {}) as Partial<Textos>;
  const lista = (v: unknown, def: string[]) => {
    const xs = Array.isArray(v) ? v.map((x) => cad(x, 290)).filter(Boolean).slice(0, 8) : [];
    return xs.length ? xs : def;
  };
  const d = TEXTOS_INICIALES;
  const textos: Textos = {
    pregunta: cad(t.pregunta, 600) || d.pregunta, si: cad(t.si, 600) || d.si, no: cad(t.no, 600) || d.no,
    aliado: cad(t.aliado, 600) || d.aliado,
    botonSi: cad(t.botonSi, 20) || d.botonSi, botonNo: cad(t.botonNo, 20) || d.botonNo, botonAliado: cad(t.botonAliado, 20) || d.botonAliado,
    pubContacto: lista(t.pubContacto, d.pubContacto), pubAliado: lista(t.pubAliado, d.pubAliado), pubCritica: lista(t.pubCritica, d.pubCritica),
    tarjetaSi: {
      titulo: cad(t.tarjetaSi?.titulo, 80) || d.tarjetaSi.titulo, subtitulo: cad(t.tarjetaSi?.subtitulo, 80) || d.tarjetaSi.subtitulo,
      boton: cad(t.tarjetaSi?.boton, 20) || d.tarjetaSi.boton,
    },
    tarjetaAliado: {
      titulo: cad(t.tarjetaAliado?.titulo, 80) || d.tarjetaAliado.titulo, subtitulo: cad(t.tarjetaAliado?.subtitulo, 80) || d.tarjetaAliado.subtitulo,
      boton: cad(t.tarjetaAliado?.boton, 20) || d.tarjetaAliado.boton,
      url: landingPermitida(cad(t.tarjetaAliado?.url, 300)) ? cad(t.tarjetaAliado?.url, 300) : d.tarjetaAliado.url,
    },
  };
  const botones = [textos.botonSi, textos.botonNo, textos.botonAliado].map((x) => x.toLowerCase());
  if (new Set(botones).size < 3) return { ok: false, error: "Los tres botones deben tener textos distintos" };
  return {
    ok: true,
    valor: {
      modo, sensible: b.sensible === true, landingUrl: landing, palabrasClave: palabras,
      detectarInteres: b.detectarInteres !== false, umbral, contexto: cad(b.contexto, 600) || null, textos,
    },
  };
}
