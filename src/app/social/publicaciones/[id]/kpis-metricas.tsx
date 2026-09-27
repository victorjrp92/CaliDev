import { Kpi } from "../../ui/kpi";

/** Métricas de Instagram de la última medición (se miden cada hora). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function KpisMetricas({ m, leads }: { m: any | null; leads: number }) {
  const n = (v: unknown) => (v === null || v === undefined ? "—" : Number(v));
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Kpi etiqueta="Vistas" valor={n(m?.vistas)} />
      <Kpi etiqueta="Alcance" valor={n(m?.alcance)} />
      <Kpi etiqueta="Guardados" valor={n(m?.guardados)} />
      <Kpi etiqueta="Compartidos" valor={n(m?.compartidos)} />
      <Kpi etiqueta="Comentarios" valor={n(m?.comentarios)} />
      <Kpi etiqueta="Leads" valor={leads} destacado />
      {!m && <p className="col-span-full text-xs text-[#55635C]">Las métricas de Instagram se miden cada hora; todavía no hay medición de esta publicación.</p>}
    </div>
  );
}
