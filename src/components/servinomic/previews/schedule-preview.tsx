import { PreviewShell, PreviewLabel } from "@/components/servinomic/previews/shell";

/** Nombres, barrios y horarios inventados — nunca datos de un cliente real. */
const SERVICES = [
  { time: "7:00", who: "Ana M.", where: "Barrio Norte · Cra 12 #4-30", state: "en curso" },
  { time: "9:30", who: "Carla R.", where: "Zona Sur · Calle 8 #15-22", state: "programado" },
  { time: "14:00", who: "Luz D.", where: "Centro · Av 3 #7-11", state: "supervisión" },
];

const STATE_STYLE: Record<string, string> = {
  "en curso": "bg-[#E6E8E3] text-[#0A3D2E]",
  programado: "bg-[#F5F2EC] text-[#77847C]",
  supervisión: "bg-[#FFF3DC] text-[#8A5B12]",
};

/** Agenda del día: quién va dónde, sin buscar en el cuaderno ni en WhatsApp. */
export function SchedulePreview() {
  return (
    <PreviewShell title="Servicios de hoy">
      <div className="flex items-center justify-between">
        <PreviewLabel>Jueves · 18 servicios</PreviewLabel>
        <span className="text-[9px] font-bold text-[#0A3D2E]">
          Todas asignadas
        </span>
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5">
        {SERVICES.map((service) => (
          <li
            key={service.time}
            className="flex items-start gap-2.5 rounded-lg border border-[#F0EBE2] px-2.5 py-2"
          >
            <span className="font-mono text-[10px] font-bold text-[#0A3D2E]">
              {service.time}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold">
                {service.who}
              </span>
              <span className="block truncate text-[9.5px] text-[#77847C]">
                {service.where}
              </span>
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${STATE_STYLE[service.state]}`}
            >
              {service.state}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 rounded-lg bg-[#F5F2EC] px-2.5 py-1.5 text-[9px] text-[#46554D]">
        Disponibilidad de la semana ya cargada · 4 cupos libres el sábado
      </p>
    </PreviewShell>
  );
}
