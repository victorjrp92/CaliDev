import type { Embudo } from "@/lib/crm/hoy";

/**
 * El embudo de la semana contra lo que pide la meta (COP 20M/mes en mayo de
 * 2027). Los diagnósticos necesarios salen de la tasa real de cierre; mientras
 * no hay diagnósticos, se dice en vez de inventar un número.
 */
export function MetaSemana({ e }: { e: Embudo }) {
  const pasos = [
    { n: e.conversaciones, t: "Conversaciones" },
    { n: e.calificados, t: "Calificados" },
    { n: e.diagnosticos_agendados, t: "Diagnósticos agendados" },
    { n: e.diagnosticos_hechos, t: "Diagnósticos hechos" },
    { n: e.propuestas, t: "Propuestas" },
  ];
  const tope = Math.max(...pasos.map((p) => p.n), 1);
  const mesMeta = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${e.meta.mes}-15T00:00:00Z`));
  const semana = e.meta.diagnosticos_semana_necesarios;
  return (
    <section className="panel flex flex-col gap-4 px-[18px] pb-[18px] pt-4" aria-labelledby="t-embudo">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-embudo" className="titulo-2">Embudo de la semana</h2>
        <span className="nota num">
          Cierres del mes: {e.cierres_mes} de {e.meta.cierresNecesariosMes} necesarios
          {semana !== null
            ? ` · hacen falta ${semana} diagnósticos por semana (cierre ${Math.round((e.tasa_cierre ?? 0) * 100)} %)`
            : " · aún no hay diagnósticos registrados para calcular la tasa de cierre"}
        </span>
      </div>
      <div className="flex flex-wrap gap-5">
        {pasos.map((p) => (
          <div key={p.t} className="flex min-w-0 flex-[1_1_130px] flex-col gap-1.5">
            <span className="numero-grande">{p.n}</span>
            <span className="nota">{p.t}</span>
            <span className="riel" aria-hidden="true"><span style={{ width: `${Math.round((p.n / tope) * 100)}%` }} /></span>
          </div>
        ))}
      </div>
      <p className="nota">Meta: COP 20 M al mes en {mesMeta}; con la base de hoy ({e.meta.cierresBaseMes} cierres al mes) no alcanza.</p>
    </section>
  );
}
