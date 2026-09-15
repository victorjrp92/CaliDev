import { CtaButton } from "@/components/servinomic/cta-button";
import {
  BeautyIcon,
  CareIcon,
  CleaningIcon,
  MaintenanceIcon,
} from "@/components/servinomic/sector-icons";

/**
 * Lo que hace Cali Dev, no solo ServiNomic.
 *
 * La página entra por el caso de LimpiaExpress porque es el que la visitante
 * acaba de ver, pero quien llega puede tener una panadería o un consultorio. Si
 * solo se le ofrece un sistema de operación para empresas de servicios, se va
 * quien tenía un problema distinto y el mismo origen.
 *
 * «Flujos de trabajo» va explicado con ejemplos y sin nombrar la categoría: casi
 * nadie sabe qué es una automatización, y todo el mundo reconoce «responder por
 * décima vez el mismo mensaje».
 */
const SERVICIOS = [
  {
    Icon: CleaningIcon,
    title: "Sistemas a medida",
    body: "Como el de LimpiaExpress: coordinar al equipo, cobrar y ver la plata en un solo lugar.",
  },
  {
    Icon: MaintenanceIcon,
    title: "Tareas que se hacen solas",
    body: "Responder por décima vez el mismo mensaje, pasar datos de un lado a otro, armar el informe del lunes.",
  },
  {
    Icon: CareIcon,
    title: "Páginas web",
    body: "Para que te encuentren y te escriban sin que tengas que estar tú.",
  },
  {
    Icon: BeautyIcon,
    title: "Marca y diseño",
    body: "Logo, colores y cómo se ve tu empresa. Lo hace un diseñador del equipo.",
  },
];

/**
 * El filtro ya no es el rubro, es el momento de la empresa.
 *
 * Con la oferta completa cabe casi cualquier negocio, así que lo que distingue
 * a un buen contacto de uno perdido no es a qué se dedica: es si está atascado
 * y quiere moverse. Estos cinco renglones son los mismos criterios que puntúa
 * el formulario, escritos para que se reconozca.
 */
const FITS = [
  "Sientes que la empresa **se estancó** y no sabes por dónde moverla",
  "Trabajas **muchas horas** y aun así el día no alcanza",
  "Haces **las mismas tareas** una y otra vez, todas las semanas",
  "Manejas todo en **libretas, Excel y WhatsApp**",
  "Quieres **cambiar cómo trabajas**, no solo quejarte de cómo trabajas",
];

const DOES_NOT_FIT = [
  "Buscas contratar un servicio para tu casa u oficina",
  "Todo te funciona y no quieres cambiar nada por ahora",
];

/**
 * Sección de encaje: descalifica rápido y hace que la buena se auto-identifique.
 *
 * Con una audiencia mayormente B2C, la mayoría de visitantes no califica. Esta
 * sección hace dos trabajos a la vez: deja ir sin frustración a quien no es el
 * destinatario, y funciona como espejo para quien sí lo es. Leerse descrita
 * ("libretas, Excel y WhatsApp") convierte mejor que cualquier argumento.
 *
 * Por eso el CTA va justo después: es el punto de mayor reconocimiento.
 */
export function ServinomicFitCheck() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        ¿Esto es para ti?
      </h2>
      <p className="mt-2.5 text-base text-[#46554D]">
        Hacemos más que ServiNomic. Primero miramos tu operación y después
        decidimos qué construir.
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SERVICIOS.map(({ Icon, title, body }) => (
          <article
            key={title}
            className="rounded-2xl border border-[#D8DCD4] bg-white p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6E8E3] text-[#0A3D2E]">
              <Icon />
            </span>
            <h3 className="mt-3 text-[15px] font-bold leading-snug">{title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#46554D]">
              {body}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-3.5 text-[14px] leading-relaxed text-[#77847C]">
        Y si no sabes cuál necesitas, esa es justamente la primera conversación.
      </p>

      <h3 className="mt-8 text-[17px] font-bold leading-snug">
        Te escribimos si te pasa esto
      </h3>

      <ul className="mt-6 flex flex-col gap-2.5">
        {FITS.map((text) => (
          <Row key={text} text={text} fits />
        ))}
        {DOES_NOT_FIT.map((text) => (
          <Row key={text} text={text} fits={false} />
        ))}
      </ul>

      <div className="mt-5">
        <CtaButton variant="ghost">Sí, esto es lo mío</CtaButton>
      </div>
    </section>
  );
}

function Row({ text, fits }: { text: string; fits: boolean }) {
  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        fits
          ? "border-[#D8DCD4] bg-white"
          : "border-dashed border-[#D8DCD4] opacity-70"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${
          fits ? "bg-[#0A3D2E]" : "bg-[#C6CCC3]"
        }`}
      >
        {fits ? "✓" : "✕"}
      </span>
      <p className="text-[15px] leading-snug">{renderBold(text)}</p>
    </li>
  );
}

/** Permite marcar énfasis con **dobles asteriscos** sin meter HTML en los datos. */
function renderBold(text: string) {
  return text.split("**").map((chunk, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold">
        {chunk}
      </strong>
    ) : (
      chunk
    )
  );
}
