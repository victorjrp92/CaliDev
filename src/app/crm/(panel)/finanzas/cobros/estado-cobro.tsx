import type { Cobro } from "@/lib/crm/cobros";

/** Estado de un cobro en una pastilla: en mora con sus días, pendiente, pagado o anulado. */
export function EstadoCobro({ c }: { c: Pick<Cobro, "estado" | "mora" | "dias_mora"> }) {
  if (c.estado === "pagado") return <span className="pill pill-ok">Pagado</span>;
  if (c.estado === "anulado") return <span className="pill pill-neutro">Anulado</span>;
  if (c.mora) return <span className="pill pill-aviso">{c.dias_mora === 1 ? "1 día en mora" : `${c.dias_mora} días en mora`}</span>;
  return <span className="pill pill-info">Pendiente</span>;
}
