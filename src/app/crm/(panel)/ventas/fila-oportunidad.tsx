import Link from "next/link";
import { cuando, fecha, plata } from "@/lib/crm/formato";
import type { Oportunidad } from "@/lib/crm/oportunidades";
import { EtiquetaEtapa } from "../etiqueta-etapa";

/** Una oportunidad en una lista: quién, en qué etapa y qué toca después (en rojo si ya pasó). */
export function FilaOportunidad({ o, conEtapa = true, ahora }: { o: Oportunidad; conEtapa?: boolean; ahora: Date }) {
  const c = cuando(o.proximo_paso_at, ahora);
  return (
    <Link href={`/crm/ventas/${o.id}`} className="flex flex-col gap-1.5 px-4 py-3 hover:bg-[var(--hueso)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{o.titulo}</span>
        {conEtapa && <EtiquetaEtapa etapa={o.etapa} />}
        {(o.valor_arranque || o.valor_mensual) && (
          <span className="cifra text-[13px] text-[#5F6B64]">
            {plata(o.valor_arranque, o.moneda)}{o.valor_mensual ? ` + ${plata(o.valor_mensual, o.moneda)}/mes` : ""}
          </span>
        )}
      </div>
      {(o.persona || o.empresa) && <p className="text-[13.5px] text-[#46554D]">{[o.persona, o.empresa].filter(Boolean).join(" · ")}</p>}
      {o.proximo_paso && (
        <p className="text-[13.5px]">
          <span className={c.vencido ? "font-semibold text-[#B42318]" : "text-[#46554D]"}>
            {c.vencido ? "Vencido " : ""}{c.texto} ({fecha(o.proximo_paso_at)})
          </span>{" "}
          · {o.proximo_paso}
        </p>
      )}
      {o.motivo_perdida && <p className="text-[13.5px] text-[#46554D]">Motivo: {o.motivo_perdida}</p>}
    </Link>
  );
}
