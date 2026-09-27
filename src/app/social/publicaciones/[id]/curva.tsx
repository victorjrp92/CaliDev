import type { Caida, Punto } from "@/lib/social/caidas";

/** Curva de retención (de la captura de Instagram) con la zona del gancho y las caídas marcadas. */
export function Curva({ puntos, caidas }: { puntos: Punto[]; caidas: Caida[] }) {
  const fin = Math.max(...puntos.map((p) => p.s), 1);
  const X = (s: number) => 48 + (s / fin) * 572;
  const Y = (p: number) => 16 + ((100 - p) / 100) * 176;
  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${X(p.s).toFixed(1)},${Y(p.pct).toFixed(1)}`).join(" ");
  const pctEn = (s: number) => puntos.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a)).pct;
  const marcas = [0, Math.round(fin / 4), Math.round(fin / 2), Math.round((3 * fin) / 4), Math.round(fin)];
  return (
    <svg viewBox="0 0 640 216" className="h-auto w-full" role="img"
      aria-label={`Curva de retención: termina en ${Math.round(puntos[puntos.length - 1].pct)} %, ${caidas.length} caídas marcadas`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1="48" x2="620" y1={Y(v)} y2={Y(v)} stroke="#EEF0EB" />
          <text x="40" y={Y(v) + 4} fontSize="11" fill="#55635C" textAnchor="end">{v} %</text>
        </g>
      ))}
      <rect x="48" y="16" width={X(3) - 48} height="176" fill="#C8F045" opacity="0.28" />
      <text x={(48 + X(3)) / 2} y="30" fontSize="10" fill="#0A3D2E" textAnchor="middle" fontWeight="700">GANCHO</text>
      <path d={`${linea} L${X(fin)},${Y(0)} L${X(0)},${Y(0)} Z`} fill="#0A3D2E" opacity="0.08" />
      <path d={linea} fill="none" stroke="#0A3D2E" strokeWidth="2.5" strokeLinejoin="round" />
      {caidas.map((c, i) => (
        <g key={i}>
          <circle cx={X(c.hasta)} cy={Y(pctEn(c.hasta))} r="6" fill={c.gancho ? "#E08A2E" : "#B8452E"} stroke="#fff" strokeWidth="2" />
          <text x={X(c.hasta) + 10} y={Y(pctEn(c.hasta)) - 8} fontSize="12" fontWeight="700" fill="#8F2E1B">{String.fromCharCode(65 + i)}</text>
        </g>
      ))}
      {marcas.map((s) => (
        <text key={s} x={X(s)} y="210" fontSize="11" fill="#55635C" textAnchor="middle">
          {`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
        </text>
      ))}
    </svg>
  );
}
