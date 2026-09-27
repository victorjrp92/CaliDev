import { CTA_DELEGAR } from "@/lib/delegar/textos";

/**
 * El botón de entrada al formulario. Siempre el mismo texto y siempre a
 * `#registro`: no abre otro canal ni saca de la página.
 *
 * `data-cta-entrada` es lo que mira la barra fija para esconderse mientras uno
 * de estos botones está a la vista — dos botones iguales en pantalla sobran.
 *
 * `id` es obligatorio y fijo (`cta-hero`, `cta-cierre`): el mapa de calor de
 * calidev.dev/social identifica cada botón por él. Cambiarlo rompe el
 * histórico de clics de ese botón.
 */
export function BotonCta({ id, className = "" }: { id: string; className?: string }) {
  return (
    <a
      id={id}
      href="#registro"
      data-cta-entrada
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--lima)] px-6 text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] transition-transform active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] ${className}`}
    >
      {CTA_DELEGAR}
      <span aria-hidden="true">→</span>
    </a>
  );
}
