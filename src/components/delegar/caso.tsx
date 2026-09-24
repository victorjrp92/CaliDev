/**
 * Prueba breve del caso de Deisy. La persona ya vio su historia en el video:
 * aquí va solo la evidencia, sin contarla otra vez.
 *
 * Cifras confirmadas por Víctor: 40 horas por semana, +56 % de ingresos y de 10
 * a 22 colaboradoras. No se añaden periodos ni métodos de medición que no
 * estén en las fuentes.
 *
 * La cita es un fragmento literal del testimonio que ya estaba publicado
 * (lib/campaigns.ts), sin retocar ni una palabra.
 */
const CIFRAS = [
  { valor: "40 h", texto: "recuperadas por semana" },
  { valor: "56%", texto: "más ingresos" },
  { valor: "10 → 22", texto: "colaboradoras" },
];

export function Caso() {
  return (
    <section id="caso" className="mx-auto max-w-xl scroll-mt-20 px-5 py-10">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">
        El cambio que viste en LimpiaExpress
      </h2>
      <ul className="mt-5 grid grid-cols-3 gap-2.5">
        {CIFRAS.map((c) => (
          <li key={c.texto} className="rounded-2xl border border-[#D8DCD4] bg-white px-3 py-4">
            <span className="block text-[24px] font-extrabold leading-none tracking-tight text-[var(--verde)] tabular-nums">
              {c.valor}
            </span>
            <span className="mt-2 block text-[13px] leading-snug text-[#46554D]">{c.texto}</span>
          </li>
        ))}
      </ul>
      <blockquote className="mt-6 border-l-[3px] border-[var(--verde)] pl-4">
        <p className="text-[17px] leading-relaxed text-[#2C3A33]">
          «Cali Dev entendió que mi problema no era de ventas, era de tiempo y herramientas. Pasé de
          planear por horas a dirigir en minutos.»
        </p>
        <footer className="mt-2.5 text-[14px] text-[#46554D]">
          <cite className="not-italic">
            <strong className="font-bold text-[var(--tinta)]">Deisy Moncayo</strong> · CEO,
            LimpiaExpress Cali
          </cite>
        </footer>
      </blockquote>
    </section>
  );
}
