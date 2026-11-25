import Link from "next/link";
import { cuando, plata } from "@/lib/crm/formato";
import type { FinanzasHoy } from "@/lib/crm/hoy";
import { META } from "@/lib/crm/hoy";
import { FilaEnlace } from "../fila-enlace";
import { MetaIngreso } from "../finanzas/meta-ingreso";

/** La plata de hoy: MRR, ingreso del mes contra la meta, la mora y los cobros que vencen (vencidos primero, máximo 5). */
export function PanelFinanzas({ f }: { f: FinanzasHoy }) {
  const vencen = [...f.cobros_vencen].sort((x, y) => Number(y.mora) - Number(x.mora) || x.vence_at.localeCompare(y.vence_at)).slice(0, 5);
  return (
    <section className="panel flex flex-col gap-4 pb-1 pt-4" aria-labelledby="t-finanzas">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-[18px]">
        <h2 id="t-finanzas" className="titulo-2">Plata</h2>
        <Link href="/crm/finanzas" className="text-[13px] font-semibold">Ver Finanzas</Link>
      </div>
      <div className="flex flex-wrap gap-5 px-[18px]">
        <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
          <span className="numero-grande break-words">{plata(f.mrr_cop)}</span>
          <span className="nota">MRR (ingreso mensual recurrente)</span>
        </div>
        <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
          <span className="numero-grande break-words">{plata(f.ingreso_mes_cop)}</span>
          <span className="nota">Ingreso del mes</span>
        </div>
        <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-1.5">
          <span className={`numero-grande break-words ${f.mora_cobros > 0 ? "text-[var(--peligro)]" : ""}`}>{plata(f.mora_total_cop)}</span>
          <span className="nota">
            En mora · {f.mora_cobros} {f.mora_cobros === 1 ? "cobro" : "cobros"}
            {f.mora_cobros > 0 && <> · <Link href="/crm/finanzas/cobros?vista=mora" className="font-semibold">Ver</Link></>}
          </span>
        </div>
      </div>
      <div className="px-[18px]">
        <MetaIngreso ingreso={f.ingreso_mes_cop} meta={f.meta_cop} avance={f.avance} mesesRestantes={f.meses_restantes} mesMeta={META.mes} />
      </div>
      <div>
        <h3 className="subgrupo"><span>Cobros que vencen en 7 días</span><span className="num">{vencen.length}</span></h3>
        {vencen.length ? vencen.map((c) => (
          <FilaEnlace key={c.id} href="/crm/finanzas/cobros?vista=mora" alerta={c.mora}
            titulo={`${c.empresa} · ${plata(c.valor, c.moneda)}`}
            detalle={`${c.mora ? "Venció" : "Vence"} ${cuando(`${c.vence_at}T12:00:00-05:00`).texto}${c.mora ? ` · ${c.dias_mora} ${c.dias_mora === 1 ? "día" : "días"} en mora` : ""}`} />
        )) : <p className="nota border-t border-[var(--linea)] px-[18px] py-4">Nada vence en los próximos 7 días.</p>}
      </div>
    </section>
  );
}
