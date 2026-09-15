import { PreviewShell } from "@/components/servinomic/previews/shell";

/**
 * El flujo del link de agendamiento, en tres pasos.
 *
 * Es el ejemplo concreto de «flujo de trabajo». La palabra no la entiende casi
 * nadie; esto sí: entra por un link, deja sus datos, y el servicio aparece en la
 * agenda sin que nadie lo vuelva a escribir.
 *
 * Los pasos salen de la página real de LimpiaExpress: nombre y teléfono, luego
 * servicio con fecha y hora, luego dirección. No es un ejemplo inventado.
 */
const PASOS = [
  { n: "1", titulo: "Entra por el link", detalle: "Desde la web o desde Instagram" },
  { n: "2", titulo: "Deja sus datos", detalle: "Nombre, teléfono y dirección" },
  { n: "3", titulo: "Escoge el servicio", detalle: "Con fecha y hora" },
];

export function AgendaPreview() {
  return (
    <PreviewShell title="Agendamiento">
      <div className="p-3.5">
        <ol className="flex flex-col">
          {PASOS.map((paso, i) => (
            <li key={paso.n}>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--verde)] text-[12px] font-bold text-[var(--hueso)]"
                >
                  {paso.n}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug">
                    {paso.titulo}
                  </span>
                  <span className="block text-[11.5px] leading-snug text-[#77847C]">
                    {paso.detalle}
                  </span>
                </span>
              </div>
              {/* El hilo baja desde el centro del número, no desde el borde. */}
              <span
                aria-hidden="true"
                className="ml-[13px] block h-3.5 w-0.5 bg-[var(--verde)]/30"
              />
            </li>
          ))}
        </ol>

        {/* El final del flujo va marcado en lima: es donde aterriza el servicio
            y es lo que la dueña deja de hacer a mano. */}
        <div className="flex items-center gap-3 rounded-xl bg-[var(--lima)] px-3 py-2.5">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--tinta)] text-[13px] font-bold text-[var(--hueso)]"
          >
            ✓
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-[var(--tinta)]">
              Aparece en la agenda
            </span>
            <span className="block text-[11.5px] leading-snug text-[var(--tinta)]/70">
              Sin que nadie lo vuelva a escribir
            </span>
          </span>
        </div>
      </div>
    </PreviewShell>
  );
}
