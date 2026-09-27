/**
 * Embudo de la publicación: de comentar a llenar el formulario. Cada barra es
 * proporcional al primer paso; el porcentaje es contra el paso anterior.
 */
export function Embudo({ e }: { e: { comentaron: number; mensaje: number; si: number; landing: number; formulario: number } }) {
  const pasos = [
    { t: "Comentaron", n: e.comentaron, c: "bg-[var(--verde)]" },
    { t: "Recibieron mensaje", n: e.mensaje, c: "bg-[var(--verde)]" },
    { t: "Tocaron «Sí, tengo negocio»", n: e.si, c: "bg-[var(--lima)]" },
    { t: "Abrieron la landing", n: e.landing, c: "bg-[var(--lima)]" },
    { t: "Llenaron el formulario", n: e.formulario, c: "bg-[#E08A2E]" },
  ];
  const max = Math.max(1, e.comentaron);
  return (
    <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
      <h2 className="mb-4 text-lg font-bold">Embudo de esta publicación</h2>
      <ol className="flex flex-col gap-2.5 text-sm">
        {pasos.map((p, i) => {
          const previo = i ? pasos[i - 1].n : null;
          const pct = previo ? Math.round((p.n / previo) * 100) : null;
          return (
            <li key={p.t} className="grid grid-cols-[minmax(0,11rem)_1fr_4.5rem] items-center gap-3">
              <span>{p.t}</span>
              <span className="h-6 rounded-md bg-[#F0F2EE]">
                <span className={`block h-full rounded-md ${p.c}`} style={{ width: `${Math.max(p.n ? 2 : 0, (p.n / max) * 100)}%` }} />
              </span>
              <span className="text-right font-semibold">
                {p.n}{pct !== null && <span className="ml-1 font-normal text-[#55635C]">{pct} %</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
