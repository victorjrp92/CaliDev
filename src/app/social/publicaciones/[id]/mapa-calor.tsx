import { SECCIONES_LANDING } from "@/lib/social/consultas";

/**
 * Mapa de calor sobre una maqueta de celular. Cada sección de la landing es
 * una franja (misma altura: no sabemos la real), teñida según cuánta gente
 * llegó a verla; encima, cada clic real en su posición relativa. Los clics
 * se superponen con transparencia: donde se acumulan, arde.
 */
const NOMBRE: Record<string, string> = {
  propuesta: "Propuesta", caso: "Caso", servicio: "Servicio", despues: "Después",
  formulario: "Formulario", detalle: "Detalle", preguntas: "Preguntas", cierre: "Cierre",
};
const ANCHO = 260, ALTO_SEC = 84, X0 = 20, Y0 = 60;

export function MapaCalor({ secciones, clics }: {
  secciones: { seccion: string; pct: number }[];
  clics: { seccion: string; x: number; y: number; muerto: boolean; rabia: boolean }[];
}) {
  const orden = SECCIONES_LANDING.filter((s) => secciones.some((x) => x.seccion === s));
  const alto = Y0 + orden.length * ALTO_SEC + 30;
  const top = (s: string) => Y0 + orden.indexOf(s) * ALTO_SEC;
  return (
    <svg viewBox={`0 0 ${ANCHO + 40} ${alto}`} className="mx-auto h-auto w-full max-w-[300px]" role="img"
      aria-label={`Mapa de calor: ${clics.length} clics sobre ${orden.length} secciones`}>
      <rect x="4" y="4" width={ANCHO + 32} height={alto - 8} rx="28" fill="#14201B" />
      <rect x={X0} y={Y0 - 40} width={ANCHO} height={alto - Y0 + 20} rx="16" fill="#FAFAF7" />
      <rect x={X0} y={Y0 - 40} width={ANCHO} height="36" fill="#0A3D2E" />
      <text x={X0 + 10} y={Y0 - 17} fontSize="10" fill="#C8F045" fontWeight="700">★ Vienes del video</text>
      {orden.map((s) => {
        const pct = secciones.find((x) => x.seccion === s)?.pct ?? 0;
        return (
          <g key={s}>
            <rect x={X0} y={top(s)} width={ANCHO} height={ALTO_SEC} fill="#0A3D2E" opacity={0.06 + (pct / 100) * 0.34} />
            <line x1={X0} x2={X0 + ANCHO} y1={top(s)} y2={top(s)} stroke="#FAFAF7" strokeDasharray="3 3" />
            <text x={X0 + 8} y={top(s) + 14} fontSize="9" fill="#14201B" fontWeight="600">{NOMBRE[s] ?? s}</text>
            <text x={X0 + ANCHO - 8} y={top(s) + 14} fontSize="9" fill="#14201B" textAnchor="end">{pct} % llegó</text>
          </g>
        );
      })}
      {clics.filter((c) => orden.includes(c.seccion)).map((c, i) => (
        <circle key={i} cx={X0 + c.x * ANCHO} cy={top(c.seccion) + c.y * ALTO_SEC} r={c.rabia ? 9 : 7}
          fill={c.muerto ? "#8C9A93" : "#E04E1C"} opacity={c.rabia ? 0.75 : 0.28}
          stroke={c.rabia ? "#8F2E1B" : "none"} strokeWidth="1.5" />
      ))}
    </svg>
  );
}
