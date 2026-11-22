import { EJEMPLO_SERVINOMIC, type DatosServinomic } from "./plantilla-servinomic";

/**
 * Los datos de la plantilla de ServiNomic tal como llegan de un formulario o
 * de la API, con cada campo forzado a su tipo y recortado. Lo usan el panel
 * viejo y el CRM: el HTML firmado sale siempre de datos pasados por aquí.
 */
export function leerDatosServinomic(v: unknown): DatosServinomic {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const txt = (k: keyof DatosServinomic) => (typeof o[k] === "string" ? (o[k] as string).trim().slice(0, 160) : "");
  const num = (k: keyof DatosServinomic) => Math.max(0, Math.round(Number(o[k]) || 0));
  const cuotas = Array.isArray(o.cuotas)
    ? o.cuotas.slice(0, 12).map((c) => {
        const x = (c ?? {}) as Record<string, unknown>;
        return { cuando: String(x.cuando ?? "").trim().slice(0, 120), valor: Math.max(0, Math.round(Number(x.valor) || 0)) };
      })
    : [];
  return {
    ...EJEMPLO_SERVINOMIC,
    nombre: txt("nombre"),
    negocio: txt("negocio"),
    ciudad: txt("ciudad") || "Cali",
    fecha: txt("fecha"),
    arranquePublicado: num("arranquePublicado"),
    arranque: num("arranque"),
    cuotas,
    mensualidadPublicada: num("mensualidadPublicada"),
    mensualidad: num("mensualidad"),
    personas: num("personas") || 10,
    personaAdicional: num("personaAdicional"),
    mensualidadDesde: txt("mensualidadDesde"),
    mesGratis: txt("mesGratis"),
    nomina: o.nomina === true,
    consultorias: Math.min(20, num("consultorias")),
    consultoriasHasta: txt("consultoriasHasta"),
    inicio: txt("inicio"),
    finArranque: txt("finArranque"),
    permanenciaMeses: Math.min(60, num("permanenciaMeses")),
    permanenciaDesde: txt("permanenciaDesde"),
    permanenciaHasta: txt("permanenciaHasta"),
  };
}
