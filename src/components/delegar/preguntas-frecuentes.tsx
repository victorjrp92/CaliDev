/**
 * Preguntas frecuentes, después del formulario. Respuestas cortas y sin
 * promesas que el servicio no cumpla: sin mínimo de equipo inventado y sin
 * asegurar cumplimiento de normativa local por elegir un indicativo.
 */
const PREGUNTAS = [
  {
    p: "¿Esto es un software o un acompañamiento?",
    r: "Las dos cosas, en ese orden. Primero ordenamos cómo se trabaja —pasos, responsables y seguimiento— y después, si hace falta, construimos las herramientas que lo sostienen.",
  },
  {
    p: "¿La revisión tiene costo?",
    r: "La primera revisión es gratuita. Si necesitas una implementación, te presentamos una propuesta de pago.",
  },
  {
    p: "¿Aplica si mi negocio es pequeño?",
    r: "Revisamos cómo trabaja tu negocio y qué necesita, sea del tamaño que sea.",
  },
  {
    p: "¿Debo saber de tecnología?",
    r: "No. Lo dejamos configurado y acompañamos a tu equipo mientras aprende a usarlo.",
  },
  {
    p: "¿Puedo contactarlos desde otro país?",
    r: "Sí. Elige tu indicativo en el formulario y en la conversación revisamos qué cambia según dónde operas.",
  },
];

export function PreguntasFrecuentes() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">
        Preguntas frecuentes
      </h2>
      <div className="mt-5 flex flex-col gap-2.5">
        {PREGUNTAS.map((item) => (
          <details
            key={item.p}
            className="group rounded-2xl border border-[#D8DCD4] bg-white px-4 open:pb-4"
          >
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
              {item.p}
              <span aria-hidden="true" className="text-[20px] text-[var(--verde)] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-[15px] leading-relaxed text-[#2C3A33]">{item.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
