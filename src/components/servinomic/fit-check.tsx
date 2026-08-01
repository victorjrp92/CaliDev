import { CtaButton } from "@/components/servinomic/cta-button";
import {
  BeautyIcon,
  CareIcon,
  CleaningIcon,
  MaintenanceIcon,
} from "@/components/servinomic/sector-icons";

/**
 * Rubros elegidos cruzando dos criterios: encaje real con lo que hace el
 * sistema (personal en terreno, pago por horas o servicio, agenda con
 * direcciones, supervisión, cliente recurrente) y coincidencia con la audiencia
 * del anuncio, que es mayormente femenina, de 35 a 54 años y de Cali.
 */
const SECTORS = [
  {
    Icon: CleaningIcon,
    title: "Aseo y limpieza",
    body: "Empresas de aseo, lavado de muebles y alfombras, limpieza de oficinas.",
  },
  {
    Icon: CareIcon,
    title: "Cuidado y enfermería a domicilio",
    body: "Cuidado de adultos mayores, acompañamiento, enfermería por turnos.",
  },
  {
    Icon: BeautyIcon,
    title: "Belleza y estética a domicilio",
    body: "Manicura, peluquería, masajes y tratamientos que van a la casa del cliente.",
  },
  {
    Icon: MaintenanceIcon,
    title: "Mantenimiento y jardinería",
    body: "Fumigación, plomería, aires acondicionados, jardinería, piscinas.",
  },
];

const FITS = [
  "Tienes **personal operativo**: gente que presta el servicio en terreno",
  "Les pagas por **horas o por servicio**, y cuadrar eso te quita tiempo cada semana",
  "Manejas la operación en **agendas de papel, WhatsApp y uno que otro Excel**",
];

const DOES_NOT_FIT = [
  "Buscas contratar un servicio de limpieza para tu casa u oficina",
  "Trabajas sola, sin equipo a cargo",
];

/**
 * Sección de encaje: descalifica rápido y hace que la buena se auto-identifique.
 *
 * Con una audiencia mayormente B2C, la mayoría de visitantes no califica. Esta
 * sección hace dos trabajos a la vez: deja ir sin frustración a quien no es el
 * destinatario, y funciona como espejo para quien sí lo es — leerse descrita
 * ("agendas de papel, WhatsApp y uno que otro Excel") convierte mejor que
 * cualquier argumento.
 *
 * Por eso el CTA #2 va justo después: es el punto de mayor reconocimiento.
 */
export function ServinomicFitCheck() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        ¿Esto es para ti?
      </h2>
      <p className="mt-2.5 text-base text-[#4A5A53]">
        Preferimos decírtelo de una vez que hacerte llenar un formulario en vano.
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SECTORS.map(({ Icon, title, body }) => (
          <article
            key={title}
            className="rounded-2xl border border-[#E7E1D7] bg-white p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4EF] text-[#0E7A5F]">
              <Icon />
            </span>
            <h3 className="mt-3 text-[15px] font-bold leading-snug">{title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#4A5A53]">
              {body}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-3.5 text-[14px] leading-relaxed text-[#87938C]">
        …y cualquier empresa que mande gente a prestar un servicio: catering,
        seguridad, lavandería, mudanzas.
      </p>

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
          ? "border-[#E7E1D7] bg-white"
          : "border-dashed border-[#E7E1D7] opacity-70"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${
          fits ? "bg-[#0E7A5F]" : "bg-[#C9BFB2]"
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
