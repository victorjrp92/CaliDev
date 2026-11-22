import type { FilaAuditoria } from "@/lib/crm/auditoria";
import { fechaHora } from "@/lib/crm/formato";

const ORIGEN = { ui: "navegador", cli: "CLI", agente: "agente", sistema: "sistema" } as Record<string, string>;

/** Quién hizo qué y por dónde. Plegado: se abre cuando hace falta saber quién tocó algo. */
export function Registro({ filas, titulo = "Registro de cambios" }: { filas: FilaAuditoria[]; titulo?: string }) {
  return (
    <details className="group">
      <summary className="cursor-pointer select-none text-[14.5px] font-semibold text-[var(--verde)]">{titulo} ({filas.length})</summary>
      {filas.length ? (
        <ol className="mt-3 flex flex-col divide-y divide-[var(--linea-tinta)] text-[13.5px]">
          {filas.map((f) => (
            <li key={f.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span className="cifra text-[#5F6B64]">{fechaHora(f.at)}</span>
              <span className="font-medium">{f.usuario ?? "sistema"}</span>
              <span className="chip">{ORIGEN[f.origen] ?? f.origen}</span>
              <span>{f.accion.replace(/_/g, " ")} {f.entidad}{f.entidad_id ? ` ${f.entidad_id}` : ""}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-[14px] text-[#5F6B64]">Sin registros.</p>
      )}
    </details>
  );
}
