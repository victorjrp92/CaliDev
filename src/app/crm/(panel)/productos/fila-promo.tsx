import type { Promo } from "@/lib/crm/catalogo";
import { fecha, plata } from "@/lib/crm/formato";
import { NOMBRE_PRECIO } from "./conceptos-precio";

/** Una promo vigente: su código, qué descuenta y hasta cuándo vale. */
export function FilaPromo({ p, producto }: { p: Promo; producto: string }) {
  const descuento = p.porcentaje !== null ? `${Number(p.porcentaje)} %` : plata(p.valor);
  return (
    <div className="fila !items-start justify-between">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2"><span className="mono">{p.codigo}</span><span className="chip" data-tono="verde">−{descuento}</span></span>
        <span className="nota break-words">{p.descripcion}</span>
      </span>
      <span className="nota shrink-0 text-right">
        {NOMBRE_PRECIO[p.concepto]} · {producto}
        <span className="block">{p.vigente_hasta ? `hasta ${fecha(p.vigente_hasta)}` : "sin vencimiento"}</span>
      </span>
    </div>
  );
}
