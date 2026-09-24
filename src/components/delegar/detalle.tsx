import { Clip } from "@/components/servinomic/clip";

/**
 * Cómo se ve por dentro, DESPUÉS del formulario: es para quien quiere más
 * detalle antes de decidir, no un requisito para llenarlo.
 *
 * ServiNomic aparece como una herramienta usada en el caso, no como el
 * producto que se vende. El clip es el mismo de la página anterior, con datos
 * de demostración.
 */
const PUNTOS = [
  "Los clientes agendan por un enlace",
  "El equipo ve qué le toca cada día",
  "La información queda en un solo sitio",
];

export function Detalle() {
  return (
    <section className="bg-[#EEF0EB]">
      <div className="mx-auto max-w-xl px-5 py-10">
        <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">
          Cómo se ve por dentro
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-[#2C3A33]">
          En LimpiaExpress usamos ServiNomic, una de las herramientas que construimos.
        </p>
        <figure className="mt-5">
          <Clip
            src="/servinomic/app-servinomic.mp4"
            poster="/servinomic/app-servinomic-poster.webp"
            descripcion="ServiNomic en uso: agenda del día, equipo y servicios, con datos de demostración"
            className="overflow-hidden rounded-2xl border border-[#D8DCD4]"
          />
          <figcaption className="mt-2 text-[13px] text-[#46554D]">
            ServiNomic funcionando · datos de demostración, no de un cliente
          </figcaption>
        </figure>
        <ul className="mt-5 flex flex-wrap gap-2">
          {PUNTOS.map((p) => (
            <li key={p} className="rounded-full border border-[#D8DCD4] bg-white px-3.5 py-2 text-[14px] text-[#2C3A33]">
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[15px] text-[#2C3A33]">
          También les hicimos la página web:{" "}
          <a
            href="https://limpiaexpresscali.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--verde)] underline underline-offset-2"
          >
            limpiaexpresscali.com
          </a>
        </p>
      </div>
    </section>
  );
}
