import { PreviewShell, PreviewLabel } from "@/components/servinomic/previews/shell";

/** Nombres y cifras inventados — nunca datos de un cliente real. */
const ROWS = [
  { code: "CLB-01", name: "Ana M.", hours: "42 h", pay: "$ 486.200" },
  { code: "CLB-02", name: "Carla R.", hours: "36 h", pay: "$ 412.900" },
  { code: "CLB-03", name: "Luz D.", hours: "48 h", pay: "$ 551.400" },
];

/** Liquidación: la nómina cerrada sola, con la seguridad social ya calculada. */
export function PayrollPreview() {
  return (
    <PreviewShell title="Liquidación · semana 31">
      <div className="flex items-center justify-between rounded-lg bg-[#E6F4EF] px-3 py-2">
        <PreviewLabel>Listo para pagar</PreviewLabel>
        <span className="text-[10px] font-bold text-[#0E7A5F]">
          22 colaboradoras ✓
        </span>
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5">
        {ROWS.map((row) => (
          <li
            key={row.code}
            className="flex items-center gap-2 rounded-lg border border-[#F0EBE2] px-2.5 py-2"
          >
            <span className="rounded bg-[#F5F2EC] px-1.5 py-0.5 font-mono text-[8px] text-[#87938C]">
              {row.code}
            </span>
            <span className="flex-1 truncate text-[11px] font-semibold">
              {row.name}
            </span>
            <span className="font-mono text-[9px] text-[#87938C]">
              {row.hours}
            </span>
            <span className="font-mono text-[10px] font-bold text-[#15211C]">
              {row.pay}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex gap-1.5">
        {["Salud", "Pensión", "ARL", "Caja"].map((item) => (
          <span
            key={item}
            className="flex-1 rounded-md bg-[#F5F2EC] py-1 text-center text-[8.5px] font-semibold text-[#4A5A53]"
          >
            {item} ✓
          </span>
        ))}
      </div>
    </PreviewShell>
  );
}
