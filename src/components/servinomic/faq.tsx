const QUESTIONS = [
  {
    q: "¿Cuánto cuesta?",
    a: "Depende del tamaño de tu operación. Te lo decimos en la llamada, con el número completo y sin letra menuda. Si no te sirve, te lo decimos antes de que gastes un peso.",
  },
  {
    q: "Mi empresa es pequeña, ¿igual aplica?",
    a: "Si tienes al menos 3 o 4 personas en operación, sí. Por debajo de eso normalmente te decimos que todavía no lo necesitas — y te ahorramos la llamada.",
  },
  {
    q: "No soy buena con la tecnología",
    a: "Deisy tampoco lo era. Nosotros lo dejamos configurado y acompañamos al equipo hasta que esté funcionando. Si tu gente usa WhatsApp, puede usar esto.",
  },
  {
    q: "¿Y si estoy fuera de Colombia?",
    a: "Regístrate igual. El sistema base está hecho para la ley colombiana, pero construimos versiones a medida para otros países.",
  },
];

/**
 * Las cuatro objeciones reales de esta audiencia, resueltas justo antes del
 * formulario. Van aquí y no al final porque una objeción sin responder en el
 * momento del registro es exactamente donde se pierde el lead.
 *
 * La primera abierta por defecto: el precio es lo que todo el mundo busca, y
 * esconderlo tras un clic lee como evasión.
 */
export function ServinomicFaq() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        Lo que todo el mundo pregunta
      </h2>

      <div className="mt-5 flex flex-col gap-2">
        {QUESTIONS.map((item, index) => (
          <details
            key={item.q}
            open={index === 0}
            className="group rounded-2xl border border-[#E7E1D7] bg-white px-4 py-[15px]"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="text-lg font-extrabold leading-none text-[#0E7A5F] group-open:hidden"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="hidden text-lg font-extrabold leading-none text-[#0E7A5F] group-open:block"
              >
                −
              </span>
            </summary>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#4A5A53]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
