import { CtaButton } from "@/components/servinomic/cta-button";

const STEPS = [
  {
    title: "Contestas 6 preguntas",
    body: "Sobre tu operación. Menos de un minuto y no hay que agendar nada.",
  },
  {
    title: "Revisamos tu caso a mano",
    body: "Miramos cada registro y priorizamos las empresas donde el sistema hace más diferencia.",
  },
  {
    title: "Te escribimos por WhatsApp",
    body: "Si encajamos, agendamos 30 minutos y te entregamos el diagnóstico. Sin pitch: te decimos honestamente si te sirve o no.",
  },
];

/**
 * El recorrido explicado antes de recorrerlo, para quitar el miedo a lo
 * desconocido — que es la objeción real detrás de un formulario abandonado.
 *
 * Decir que el contacto lo inicia CaliDev y que hay revisión manual es lo que
 * convierte la espera en señal de selección en vez de en abandono. El CTA #3 va
 * al final: ya sabe exactamente qué pasa si se registra.
 */
export function ServinomicProcess({ slots }: { slots: number }) {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        Cómo funciona tu diagnóstico
      </h2>

      <ol className="mt-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute bottom-0.5 left-4 top-9 w-0.5 bg-[#E7E1D7]"
              />
            )}
            <span className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E6F4EF] text-sm font-extrabold text-[#0E7A5F]">
              {index + 1}
            </span>
            <div>
              <h3 className="text-base font-bold">{step.title}</h3>
              <p className="mt-1 text-[14.5px] leading-relaxed text-[#4A5A53]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-2xl bg-[#E6F4EF] p-4 text-[14.5px] leading-relaxed text-[#0A5A46]">
        Acompañamos{" "}
        <strong className="font-bold">{slots} empresas a la vez</strong> para dar
        el mejor servicio y el más personalizado.
      </p>

      {/* La audiencia del anuncio es un tercio internacional. Sin este mensaje,
          quien no está en Colombia se auto-descarta al ver el formulario. */}
      <p className="mt-3 rounded-2xl border border-[#E7E1D7] bg-white p-4 text-[14.5px] leading-relaxed text-[#4A5A53]">
        <strong className="font-bold text-[#15211C]">
          ¿No estás en Colombia?
        </strong>{" "}
        También trabajamos con empresas de México, Perú, España, Estados Unidos
        y el resto de Latinoamérica. Adaptamos el sistema a las reglas de tu
        país — dinos cuál en el formulario.
      </p>

      <div className="mt-5">
        <CtaButton reassurance="Sin compromiso · Te contactamos nosotros" />
      </div>
    </section>
  );
}
