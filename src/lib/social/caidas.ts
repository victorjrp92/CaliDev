/**
 * Caídas de la curva de retención, alineadas con las escenas del video.
 * Una caída es una bajada de más de `umbral` puntos dentro de `ventana`
 * segundos. La del gancho (primeros 3 s) se marca aparte: siempre existe y se
 * compara con el skip rate, no se trata como un fallo.
 */
export interface Punto { s: number; pct: number }
export interface Escena { t0: number; t1: number; visual?: string; dicho?: string }
export interface Caida { desde: number; hasta: number; puntos: number; gancho: boolean; escena: Escena | null }

export function detectarCaidas(curva: Punto[], escenas: Escena[], umbral = 8, ventana = 3): Caida[] {
  const pts = [...curva].sort((a, b) => a.s - b.s);
  const caidas: Caida[] = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = i + 1;
    while (j < pts.length && pts[j].s - pts[i].s <= ventana) j++;
    const tramo = pts.slice(i, j);
    const min = tramo.reduce((a, b) => (b.pct < a.pct ? b : a));
    const bajada = pts[i].pct - min.pct;
    if (bajada > umbral && min.s > pts[i].s) {
      const escena = escenas.find((e) => min.s >= e.t0 && min.s <= e.t1) ?? null;
      caidas.push({ desde: pts[i].s, hasta: min.s, puntos: Math.round(bajada), gancho: pts[i].s < 3, escena });
      i = pts.indexOf(min);
    } else i++;
  }
  return caidas;
}
