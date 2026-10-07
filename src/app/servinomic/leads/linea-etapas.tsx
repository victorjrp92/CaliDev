import type { Paso } from "@/lib/seguimiento/personas";

/**
 * Los pasos de una persona, de izquierda a derecha, con la fecha de cada uno.
 * Verde lleno = hecho; aro lima = lo que está en curso (una cita por venir);
 * gris = todavía no. En el teléfono se parte en varias filas.
 */
const FECHA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });

export function LineaEtapas({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-3">
      {pasos.map((p, i) => (
        <li key={p.clave} className="flex items-start gap-1">
          <div className="flex w-[92px] flex-col items-center text-center">
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] font-bold ${
                p.estado === "hecho"
                  ? "border-[var(--verde)] bg-[var(--verde)] text-[var(--lima)]"
                  : p.estado === "actual"
                    ? "border-[var(--verde)] bg-[var(--lima)] text-[var(--tinta)]"
                    : "border-[#D8DCD4] bg-white text-[#8C948D]"
              }`}
            >
              {p.estado === "hecho" ? "✓" : i + 1}
            </span>
            <span className={`mt-1 text-[11.5px] leading-tight ${p.estado === "pendiente" ? "text-[#8C948D]" : "font-semibold text-[#14201B]"}`}>
              {p.nombre}
            </span>
            {p.fecha && <span className="text-[11px] text-[#46554D]">{FECHA.format(new Date(p.fecha))}</span>}
            {p.detalle && <span className="text-[10.5px] text-[#46554D]">{p.detalle}</span>}
            <span className="sr-only">{p.estado === "hecho" ? "hecho" : p.estado === "actual" ? "en curso" : "pendiente"}</span>
          </div>
          {i < pasos.length - 1 && <span aria-hidden="true" className="mt-3 h-px w-3 bg-[#D8DCD4]" />}
        </li>
      ))}
    </ol>
  );
}
