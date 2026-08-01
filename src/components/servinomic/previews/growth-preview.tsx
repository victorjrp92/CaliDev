import { PreviewShell, PreviewLabel } from "@/components/servinomic/previews/shell";

/** Todo inventado — zonas y conteos ilustrativos, nunca de un cliente real. */
const ZONES = [
  { name: "Zona Norte", services: 53, share: 100 },
  { name: "Zona Sur", services: 31, share: 58 },
  { name: "Centro", services: 19, share: 36 },
];

/** Lo que ninguna app de nómina hace: decirte dónde está el crecimiento. */
export function GrowthPreview() {
  return (
    <PreviewShell title="Necesita tu atención">
      <div className="flex items-start gap-2 rounded-lg bg-[#FFF3DC] px-3 py-2.5">
        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#B8791F]" />
        <p className="text-[10.5px] leading-snug text-[#7A5312]">
          <strong className="font-bold">14 clientes</strong> llevan más tiempo
          del habitual sin pedir servicio
        </p>
      </div>

      <div className="mt-3">
        <PreviewLabel>Dónde está la demanda</PreviewLabel>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {ZONES.map((zone) => (
            <li key={zone.name}>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-semibold">{zone.name}</span>
                <span className="font-mono text-[9.5px] text-[#87938C]">
                  {zone.services} servicios
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F0EBE2]">
                <span
                  className="block h-full rounded-full bg-[#0E7A5F]"
                  style={{ width: `${zone.share}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <span className="flex-1 rounded-md bg-[#F5F2EC] px-2 py-1.5 text-center">
          <span className="block font-mono text-[11px] font-bold text-[#0E7A5F]">
            94%
          </span>
          <span className="block text-[8px] text-[#87938C]">Retención</span>
        </span>
        <span className="flex-1 rounded-md bg-[#F5F2EC] px-2 py-1.5 text-center">
          <span className="block font-mono text-[11px] font-bold text-[#0E7A5F]">
            Referidos
          </span>
          <span className="block text-[8px] text-[#87938C]">Mejor canal</span>
        </span>
      </div>
    </PreviewShell>
  );
}
