import { PLAZO_RESPUESTA, REVISION_GRATIS } from "@/lib/delegar/textos";

/**
 * Qué pasa al enviar el formulario, ANTES del formulario: quien sabe qué le
 * espera llena con menos dudas. Son pasos reales y en orden, por eso van
 * numerados.
 *
 * No promete llamada a todo el mundo («si procede») ni un plazo sin confirmar.
 */
export function Despues() {
  const pasos = [
    {
      titulo: "Nos cuentas cómo trabajas.",
      texto: "El formulario recoge tu situación y lo que buscas cambiar.",
    },
    {
      titulo: "Revisamos tu caso.",
      texto: "Leemos las respuestas para entender tu operación y preparar el siguiente paso.",
    },
    {
      titulo: "Te contactamos por WhatsApp.",
      texto: `${PLAZO_RESPUESTA ? `${PLAZO_RESPUESTA}. ` : ""}Si procede, coordinamos una llamada de 30 minutos para revisar qué conviene para tu caso particular.`,
    },
  ];

  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">Qué pasa después</h2>
      <ol className="mt-5 flex flex-col gap-4">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--verde)] text-[14px] font-bold text-[var(--hueso)]"
            >
              {i + 1}
            </span>
            <p className="pt-1 text-[15.5px] leading-relaxed text-[#2C3A33]">
              <strong className="font-bold text-[var(--tinta)]">{p.titulo}</strong> {p.texto}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-2xl bg-[#E6E8E3] px-4 py-3.5 text-[15px] font-semibold text-[var(--verde-hondo)]">
        {REVISION_GRATIS}
      </p>
    </section>
  );
}
