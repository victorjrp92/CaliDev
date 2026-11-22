/**
 * Etapas del pipeline de Ventas (spec §3, pestaña 5). Puro: sin base, para
 * que la UI, la API y el backfill usen las mismas reglas.
 */
export const ETAPAS = [
  "lead",
  "calificado",
  "diagnostico_agendado",
  "diagnostico_hecho",
  "propuesta",
  "negociacion",
  "ganado",
  "perdido",
  "pausa",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export const ETAPAS_ABIERTAS: Etapa[] = ["lead", "calificado", "diagnostico_agendado", "diagnostico_hecho", "propuesta", "negociacion"];
export const ETAPAS_CERRADAS: Etapa[] = ["ganado", "perdido", "pausa"];

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  lead: "Lead",
  calificado: "Calificado",
  diagnostico_agendado: "Diagnóstico agendado",
  diagnostico_hecho: "Diagnóstico hecho",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
  pausa: "En pausa",
};

export const esEtapa = (e: unknown): e is Etapa => typeof e === "string" && (ETAPAS as readonly string[]).includes(e);
export const estaAbierta = (e: Etapa) => ETAPAS_ABIERTAS.includes(e);
export const posicion = (e: Etapa) => ETAPAS_ABIERTAS.indexOf(e);

export type CambioEtapa = {
  a: Etapa;
  proximoPaso?: string | null;
  proximoPasoAt?: string | null;
  motivoPerdida?: string | null;
};

/**
 * Lo que exige un cambio de etapa, antes de tocar la base. Devuelve el
 * problema en palabras o null si se puede. La base repite las dos últimas
 * reglas con CHECK: esto es para que el error diga cómo arreglarlo.
 */
export function problemaDeCambio(c: CambioEtapa): { mensaje: string; campo: string } | null {
  if (!esEtapa(c.a)) return { mensaje: `Etapa desconocida. Usa una de: ${ETAPAS.join(", ")}.`, campo: "etapa" };
  if (c.a === "perdido" && !c.motivoPerdida?.trim()) {
    return { mensaje: "Para marcarla perdida hace falta el motivo (precio, tiempo, eligió otra cosa…).", campo: "motivo_perdida" };
  }
  if (estaAbierta(c.a)) {
    if (!c.proximoPaso?.trim()) return { mensaje: "Una oportunidad abierta necesita un próximo paso.", campo: "proximo_paso" };
    if (!c.proximoPasoAt || Number.isNaN(Date.parse(c.proximoPasoAt))) {
      return { mensaje: "El próximo paso necesita fecha (AAAA-MM-DD o ISO).", campo: "proximo_paso_at" };
    }
  }
  return null;
}

/**
 * Etapa del panel viejo de leads (lib/seguimiento/personas.ts) → etapa del CRM.
 * Las intermedias de la segunda cita cuentan como diagnóstico hecho: la
 * primera llamada ya ocurrió.
 */
const DESDE_LEGADO: Record<string, Etapa> = {
  "por-invitar": "lead",
  "esperando-hora-1": "calificado",
  "cita-1": "diagnostico_agendado",
  "por-invitar-2": "diagnostico_hecho",
  "esperando-hora-2": "diagnostico_hecho",
  "cita-2": "diagnostico_hecho",
  "por-proponer": "diagnostico_hecho",
  propuesta: "propuesta",
  ganado: "ganado",
  perdido: "perdido",
  pausa: "pausa",
};

export const etapaDesdeLegado = (e: string): Etapa => DESDE_LEGADO[e] ?? "lead";

/**
 * El backfill solo avanza etapas, nunca retrocede lo que alguien movió en el
 * CRM, y nunca cierra: ganado, perdido y pausa los decide un humano.
 */
export function avanceAutomatico(actual: Etapa, propuesta: Etapa): Etapa | null {
  if (!estaAbierta(actual) || !estaAbierta(propuesta)) return null;
  return posicion(propuesta) > posicion(actual) ? propuesta : null;
}
