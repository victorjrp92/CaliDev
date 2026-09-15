import { ClipHero } from "@/components/servinomic/clip-hero";
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
 * El clip enseña el servicio: tres personas trabajando en una casa. Es una
 * recreación, no una grabación real, así que va sin pie de foto que lo
 * presente como documental. Los datos ciertos del equipo están en la ficha de
 * Deisy, justo debajo.
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
        <mark className="bg-[linear-gradient(transparent_60%,var(--lima)_60%)] px-0.5 text-inherit [background-color:transparent]">
          {campaign.headlineHighlight}
        </mark>
        {after}
      </h1>

      <p className="mt-4 text-[17px] leading-snug text-[#46554D]">
        {campaign.subhead}
      </p>

      {/* En renglones y no en párrafo. Quien llega de un video no lee prosa:
          recorre la lista buscando algo que le suene a su semana, y en dos
          segundos sabe si esta página va con ella. */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {campaign.bullets.map((linea) => (
          <li key={linea} className="flex items-start gap-3 text-[16px] leading-snug">
            <span
              aria-hidden="true"
              className="mt-[0.62em] h-[3px] w-4 flex-none rounded-full bg-[var(--verde)]"
            />
            <span>{linea}</span>
          </li>
        ))}
      </ul>

      {/* El CTA va antes del clip para que quepa arriba del pliegue en móvil,
          que es de donde llega casi todo el tráfico. El clip queda como
          recompensa al primer scroll. */}
      <div className="mt-6">
        <CtaButton reassurance="Toma 1 minuto · No pedimos datos personales al inicio">
          {campaign.heroCta}
        </CtaButton>
      </div>

      <div className="mt-7">
        <ClipHero />
      </div>

      <figure className="mt-7 rounded-3xl border border-[#D8DCD4] bg-white p-5 shadow-[0_3px_14px_rgba(21,33,28,0.05)]">
        <figcaption className="flex items-center gap-3">
          <span className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#0A3D2E,#5FBFA3)] text-lg font-extrabold text-white">
            {campaign.quoteAuthor.charAt(0)}
          </span>
          <span>
            <span className="block text-[15px] font-bold">
              {campaign.quoteAuthor}
            </span>
            <span className="block text-[13px] text-[#77847C]">
              {campaign.quoteRole}
            </span>
          </span>
        </figcaption>

        <blockquote className="mt-3.5 text-base leading-relaxed">
          &ldquo;{campaign.quote}&rdquo;
        </blockquote>

        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0A3D2E]">
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
