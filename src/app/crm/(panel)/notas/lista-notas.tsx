import { fechaHora } from "@/lib/crm/formato";
import type { Nota } from "@/lib/crm/notas";
import { AgregarNota } from "./agregar-nota";

const NOMBRE = { nota: "Nota", brief: "Brief", resumen_llamada: "Resumen de llamada" } as const;

/** Notas de una entidad, la más reciente arriba. El brief se marca: es lo que se lee antes de llamar. */
export function ListaNotas({ notas, entidad, id, escribir }: { notas: Nota[]; entidad: string; id: number; escribir: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {escribir && <AgregarNota entidad={entidad} id={id} />}
      {notas.length ? (
        <ul className="flex flex-col gap-3">
          {notas.map((n) => (
            <li key={n.id} className={`bloque px-4 py-3 ${n.tipo === "brief" ? "border-l-4 border-l-[var(--lima)]" : ""}`}>
              <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#5F6B64]">
                <span className="chip" data-tono={n.tipo === "brief" ? "lima" : undefined}>{NOMBRE[n.tipo] ?? n.tipo}</span>
                {n.autor ?? "sistema"} · {fechaHora(n.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed">{n.cuerpo}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-[#5F6B64]">Sin notas todavía.</p>
      )}
    </div>
  );
}
