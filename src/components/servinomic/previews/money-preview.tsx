import { PreviewShell, PreviewLabel } from "@/components/servinomic/previews/shell";

/** Todo inventado: proporciones ilustrativas, nunca cifras de un cliente real. */
const BREAKDOWN = [
  { label: "Servicios", pct: 72, tone: "bg-[#0E7A5F]" },
  { label: "Insumos y kits", pct: 18, tone: "bg-[#5FBFA3]" },
  { label: "Otros", pct: 10, tone: "bg-[#CFE7DE]" },
];

/** El P&L del mes: punto de equilibrio, margen y gastos, sin sumar a mano. */
export function MoneyPreview() {
  return (
    <PreviewShell title="Reporte del mes">
      <div className="rounded-lg bg-[#E6F4EF] px-3 py-2.5">
        <PreviewLabel>Punto de equilibrio</PreviewLabel>
        <p className="mt-0.5 font-mono text-base font-bold text-[#0E7A5F]">
          223 <span className="text-[#87938C]">/ 212</span>
        </p>
        <p className="text-[9px] text-[#4A5A53]">
          Ya superaste los servicios que necesitas para no perder
        </p>
      </div>

      <div className="mt-3">
        <PreviewLabel>De dónde viene el ingreso</PreviewLabel>
        <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full">
          {BREAKDOWN.map((item) => (
            <span
              key={item.label}
              className={item.tone}
              style={{ width: `${item.pct}%` }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {BREAKDOWN.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${item.tone}`} />
              <span className="flex-1 text-[9.5px] text-[#4A5A53]">
                {item.label}
              </span>
              <span className="font-mono text-[9.5px] font-bold">
                {item.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2.5 rounded-lg bg-[#F5F2EC] px-2.5 py-1.5 text-[9px] text-[#4A5A53]">
        38 facturas del mes ya cargadas y clasificadas
      </p>
    </PreviewShell>
  );
}
