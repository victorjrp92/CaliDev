import { type Etapa, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { plata } from "@/lib/crm/formato";
import type { Oportunidad } from "@/lib/crm/oportunidades";
import { FilaOportunidad } from "./fila-oportunidad";

/** Una etapa del pipeline con su cuenta y lo que suma el arranque cotizado (en COP). */
export function ColumnaEtapa({ etapa, ops, ahora }: { etapa: Etapa; ops: Oportunidad[]; ahora: Date }) {
  const arranque = ops.filter((o) => o.moneda === "COP").reduce((s, o) => s + Number(o.valor_arranque ?? 0), 0);
  return (
    <section className="flex min-w-0 flex-col gap-2 md:w-[17rem] md:shrink-0">
      <header className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-[14.5px] font-bold">{NOMBRE_ETAPA[etapa]} <span className="cifra font-normal text-[#5F6B64]">{ops.length}</span></h2>
        {arranque > 0 && <span className="cifra text-[12.5px] text-[#5F6B64]">{plata(arranque)}</span>}
      </header>
      {ops.length ? (
        <div className="bloque divide-y divide-[var(--linea-tinta)]">{ops.map((o) => <FilaOportunidad key={o.id} o={o} conEtapa={false} ahora={ahora} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--linea-tinta)] px-4 py-4 text-[13.5px] text-[#5F6B64]">Vacía</p>
      )}
    </section>
  );
}
