import Link from "next/link";
import { cuando, fecha, plata } from "@/lib/crm/formato";
import type { Oportunidad } from "@/lib/crm/oportunidades";
import { EtiquetaEtapa } from "../etiqueta-etapa";

/** Una oportunidad en una lista: quién, en qué etapa y qué toca después (en rojo si ya pasó). */
export function FilaOportunidad({ o, conEtapa = true, ahora }: { o: Oportunidad; conEtapa?: boolean; ahora: Date }) {
  const c = cuando(o.proximo_paso_at, ahora);
  return (
    <Link href={`/crm/ventas/${o.id}`} className="flex flex-col gap-1 px-4 py-3 text-[var(--texto)] hover:bg-[var(--hover)] hover:text-[var(--texto)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="fuerte">{o.titulo}</span>
        {conEtapa && <EtiquetaEtapa etapa={o.etapa} />}
        {(o.valor_arranque || o.valor_mensual) && (
          <span className="cifra text-[13px] text-[var(--texto-2)]">
            {plata(o.valor_arranque, o.moneda)}{o.valor_mensual ? ` + ${plata(o.valor_mensual, o.moneda)}/mes` : ""}
          </span>
        )}
      </div>
      {(o.persona || o.empresa) && <p className="text-[13px] text-[var(--texto-2)]">{[o.persona, o.empresa].filter(Boolean).join(" · ")}</p>}
      {o.proximo_paso && (
        <p className="text-[13px]">
          <span className={c.vencido ? "font-semibold text-[var(--peligro)]" : "text-[var(--texto-2)]"}>
            {c.vencido ? "Vencido " : ""}{c.texto} ({fecha(o.proximo_paso_at)})
          </span>{" "}
          · {o.proximo_paso}
        </p>
      )}
      {o.motivo_perdida && <p className="text-[13px] text-[var(--texto-2)]">Motivo: {o.motivo_perdida}</p>}
    </Link>
  );
}
