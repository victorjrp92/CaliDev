import Image from "next/image";
import { CtaButton } from "@/components/servinomic/cta-button";
import type { Campaign } from "@/lib/campaigns";

/**
 * Hero: promesa, CTA #1 y el testimonio que respalda la promesa.
 *
 * El titular nombra al destinatario en la primera línea a propósito: la
 * audiencia de la campaña es mayormente B2C, así que la mayoría de visitantes
 * no califica. Que se vayan en tres segundos es una función de la página.
 *
 * El CTA va antes del testimonio, no después: quien ya venía convencido del
 * anuncio no debería tener que leer nada para poder actuar.
 *
 * La foto es el equipo real del cliente, no stock. Además de credibilidad hace
 * un trabajo concreto: muestra literalmente qué es "personal operativo", que es
 * el concepto que decide si la visitante califica o no.
 */
export function ServinomicHero({ campaign }: { campaign: Campaign }) {
  const [before, after] = splitHeadline(
    campaign.headline,
    campaign.headlineHighlight
  );

  return (
    <section className="mx-auto max-w-xl px-5 pb-9 pt-7">
      <h1 className="text-[31px] font-extrabold leading-[1.18] tracking-tight sm:text-[40px]">
        {before}
        {/* background-color explícito: <mark> trae amarillo por defecto del
            navegador y se asomaría por la parte transparente del gradiente. */}
        <mark className="bg-[linear-gradient(transparent_62%,#FFE28A_62%)] px-0.5 text-inherit [background-color:transparent]">
          {campaign.headlineHighlight}
        </mark>
        {after}
      </h1>

      <p className="mt-4 text-[17px] leading-relaxed text-[#4A5A53]">
        {campaign.subhead}
      </p>

      {/* El CTA va antes de la foto para que quepa arriba del pliegue en móvil:
          la foto mide 230px y lo empujaba fuera de vista, dejándolo pegado a la
          barra fija. La foto queda como recompensa al primer scroll. */}
      <div className="mt-6">
        <CtaButton reassurance="Toma 1 minuto · No pedimos datos personales al inicio">
          {campaign.heroCta}
        </CtaButton>
      </div>

      <figure className="relative mt-7 overflow-hidden rounded-3xl">
        <Image
          src={campaign.teamPhoto.src}
          alt={campaign.teamPhoto.alt}
          width={1600}
          height={896}
          priority
          sizes="(max-width: 640px) 100vw, 576px"
          className="h-[230px] w-full object-cover object-top sm:h-[280px]"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(10,25,20,0.86))] px-4 pb-3.5 pt-10 text-[13px] font-semibold text-white">
          {campaign.teamPhoto.caption}
        </figcaption>
      </figure>

      <figure className="mt-7 rounded-3xl border border-[#E7E1D7] bg-white p-5 shadow-[0_3px_14px_rgba(21,33,28,0.05)]">
        <figcaption className="flex items-center gap-3">
          <span className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#0E7A5F,#5FBFA3)] text-lg font-extrabold text-white">
            {campaign.quoteAuthor.charAt(0)}
          </span>
          <span>
            <span className="block text-[15px] font-bold">
              {campaign.quoteAuthor}
            </span>
            <span className="block text-[13px] text-[#87938C]">
              {campaign.quoteRole}
            </span>
          </span>
        </figcaption>

        <blockquote className="mt-3.5 text-base leading-relaxed">
          &ldquo;{campaign.quote}&rdquo;
        </blockquote>

        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0E7A5F]">
          <span aria-hidden="true">✓</span>
          {campaign.quoteMeta}
        </p>
      </figure>
    </section>
  );
}

/** Parte el titular alrededor del fragmento resaltado, sin usar HTML en los datos. */
function splitHeadline(headline: string, highlight: string): [string, string] {
  const index = headline.indexOf(highlight);
  if (index === -1) return [headline, ""];
  return [headline.slice(0, index), headline.slice(index + highlight.length)];
}
