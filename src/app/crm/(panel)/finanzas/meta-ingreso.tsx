import { plata } from "@/lib/crm/formato";
import { nombreMes } from "./fechas";

/** El ingreso del mes contra la meta: riel de avance y cuántos meses quedan para llegar a ella. */
export function MetaIngreso({ ingreso, meta, avance, mesesRestantes, mesMeta }: { ingreso: number; meta: number; avance: number; mesesRestantes: number; mesMeta: string }) {
  const pct = (avance * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="nota">Ingreso del mes contra la meta</span>
        <span className="nota num">{plata(ingreso)} de {plata(meta)} · {pct} %</span>
      </div>
      <span className="riel" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, avance * 100))}%` }} /></span>
      <span className="nota">
        Meta: {plata(meta)} al mes en <span className="capitalize-first">{nombreMes(mesMeta)}</span>
        {mesesRestantes > 0 ? ` · faltan ${mesesRestantes} ${mesesRestantes === 1 ? "mes" : "meses"}` : ""}.
      </span>
    </div>
  );
}
