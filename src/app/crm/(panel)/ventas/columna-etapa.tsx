import { type Etapa, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { plata } from "@/lib/crm/formato";
import type { Oportunidad } from "@/lib/crm/oportunidades";
import { FilaOportunidad } from "./fila-oportunidad";

/** Una etapa del pipeline con su cuenta y lo que suma el arranque cotizado (en COP). */
export function ColumnaEtapa({ etapa, ops, ahora }: { etapa: Etapa; ops: Oportunidad[]; ahora: Date }) {
  const arranque = ops.filter((o) => o.moneda === "COP").reduce((s, o) => s + Number(o.valor_arranque ?? 0), 0);
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-[14px] bg-[var(--columna)] p-2 md:w-[17rem] md:shrink-0" aria-label={NOMBRE_ETAPA[etapa]}>
      <header className="flex items-baseline justify-between gap-2 px-2 pt-1">
        <h2 className="titulo-3">{NOMBRE_ETAPA[etapa]} <span className="num font-normal text-[var(--texto-2)]">{ops.length}</span></h2>
        {arranque > 0 && <span className="num text-[12px] text-[var(--texto-2)]">{plata(arranque)}</span>}
      </header>
      {ops.length ? (
        <div className="bloque divide-y divide-[var(--linea)]">{ops.map((o) => <FilaOportunidad key={o.id} o={o} conEtapa={false} ahora={ahora} />)}</div>
      ) : (
        <p className="px-2 pb-2 text-[13px] text-[var(--texto-2)]">Vacía</p>
      )}
    </section>
  );
}
