import type { Embudo } from "@/lib/crm/hoy";

/**
 * El embudo de la semana contra lo que pide la meta (COP 20M/mes en mayo de
 * 2027). Los diagnósticos necesarios salen de la tasa real de cierre; mientras
 * no hay diagnósticos, se dice en vez de inventar un número.
 */
export function MetaSemana({ e }: { e: Embudo }) {
  const pasos = [
    { n: e.conversaciones, t: "conversaciones" },
    { n: e.calificados, t: "calificados" },
    { n: e.diagnosticos_agendados, t: "diagnósticos agendados" },
    { n: e.diagnosticos_hechos, t: "diagnósticos hechos" },
    { n: e.propuestas, t: "propuestas" },
  ];
  const faltan = Math.max(e.meta.cierresNecesariosMes - e.cierres_mes, 0);
  const mesMeta = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${e.meta.mes}-15T00:00:00Z`));
  return (
    <section className="overflow-hidden rounded-2xl bg-[var(--azul)] text-[var(--niebla)]">
      <div className="flex flex-col gap-1 px-5 pt-5">
        <p className="mono text-[var(--lima)]">Esta semana</p>
        <p className="text-[14.5px] text-[var(--niebla)]/80">
          Meta: COP 20 M al mes en {mesMeta}. Hacen falta unos {e.meta.cierresNecesariosMes} cierres al mes (hoy la base son {e.meta.cierresBaseMes}).
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-5 mt-4">
        {pasos.map((p) => (
          <li key={p.t} className="flex flex-col gap-1 bg-[var(--azul)] px-5 py-4">
            <span className="cifra text-[28px] font-extrabold leading-none text-[var(--hueso)]">{p.n}</span>
            <span className="text-[13px] text-[var(--niebla)]/75">{p.t}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 px-5 py-4 text-[14px]">
        <span>
          <strong className="cifra text-[var(--hueso)]">{e.cierres_mes}</strong> cierres este mes
          {faltan > 0 ? <> · faltan <strong className="cifra text-[var(--lima)]">{faltan}</strong></> : <> · <strong className="text-[var(--lima)]">meta del mes cumplida</strong></>}
        </span>
        <span>
          {e.meta.diagnosticos_semana_necesarios !== null ? (
            <>
              Diagnósticos por semana necesarios: <strong className="cifra text-[var(--hueso)]">{e.meta.diagnosticos_semana_necesarios}</strong>
              {" "}(tasa de cierre {Math.round((e.tasa_cierre ?? 0) * 100)} %)
            </>
          ) : (
            "Aún no hay diagnósticos registrados para calcular la tasa de cierre."
          )}
        </span>
      </div>
    </section>
  );
}
