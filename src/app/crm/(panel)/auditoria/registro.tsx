import type { FilaAuditoria } from "@/lib/crm/auditoria";
import { fechaHora } from "@/lib/crm/formato";

const ORIGEN = { ui: "navegador", cli: "CLI", agente: "agente", sistema: "sistema" } as Record<string, string>;

function Filas({ filas }: { filas: FilaAuditoria[] }) {
  if (!filas.length) return <p className="px-4 py-3 text-[14px] text-[var(--texto-2)]">Sin registros.</p>;
  return (
    <ol className="flex flex-col divide-y divide-[var(--linea)] text-[13.5px]">
      {filas.map((f) => (
        <li key={f.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5">
          <span className="cifra text-[var(--texto-2)]">{fechaHora(f.at)}</span>
          <span className="font-medium">{f.usuario ?? "sistema"}</span>
          <span className="chip">{ORIGEN[f.origen] ?? f.origen}</span>
          <span>{f.accion.replace(/_/g, " ")} {f.entidad}{f.entidad_id ? ` ${f.entidad_id}` : ""}</span>
        </li>
      ))}
    </ol>
  );
}

/** Quién hizo qué y por dónde. Plegado en las fichas; abierto cuando es la vista misma (Auditoría). */
export function Registro({ filas, titulo = "Registro de cambios", plegado = true }: { filas: FilaAuditoria[]; titulo?: string; plegado?: boolean }) {
  if (!plegado) return <div className="bloque"><Filas filas={filas} /></div>;
  return (
    <details className="bloque group">
      <summary className="cursor-pointer select-none px-4 py-3 text-[14px] font-semibold text-[var(--acento-texto)]">{titulo} <span className="num font-normal text-[var(--texto-2)]">{filas.length}</span></summary>
      <div className="border-t border-[var(--linea)]"><Filas filas={filas} /></div>
    </details>
  );
}
