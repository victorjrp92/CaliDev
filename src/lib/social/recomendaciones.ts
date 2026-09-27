/**
 * Recomendaciones de Inicio. Salen de reglas explícitas sobre datos reales,
 * nunca de cifras inventadas: si una regla no se cumple, no hay recomendación.
 */
export interface FilaRecomendable {
  mediaId: string;
  titulo: string;
  landing: string | null;
  modo: string | null;
  interesados: number; // comentarios quiere_contacto
  vistas: number | null;
  leads: number;
  revision: number;
}

export interface Recomendacion { mediaId: string | null; texto: string }

export function recomendaciones(filas: FilaRecomendable[], minutosDesdeCiclo: number | null, hayAutomatizacion: boolean): Recomendacion[] {
  const r: Recomendacion[] = [];
  if (hayAutomatizacion && (minutosDesdeCiclo === null || minutosDesdeCiclo > 5)) {
    r.push({ mediaId: null, texto: "El reloj del agente no está corriendo: nadie está respondiendo. Revisa cron-job.org." });
  }
  for (const f of filas) {
    if (f.interesados >= 2 && !f.landing) {
      r.push({ mediaId: f.mediaId, texto: `«${f.titulo}» tiene ${f.interesados} personas interesadas y no tiene landing. Asígnale una.` });
    }
    if ((f.vistas ?? 0) >= 1000 && f.leads === 0 && f.modo !== "automatico") {
      r.push({ mediaId: f.mediaId, texto: `«${f.titulo}» tiene alcance pero cero leads: automatízala y pide una palabra clave en el caption.` });
    }
    if (f.revision >= 5) {
      r.push({ mediaId: f.mediaId, texto: `«${f.titulo}» acumula ${f.revision} comentarios por revisar.` });
    }
  }
  return r.slice(0, 5);
}
