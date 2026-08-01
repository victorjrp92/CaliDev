import type { Campaign } from "@/lib/campaigns";

/**
 * El momento humano de la página.
 *
 * "40 horas semanales" es una cifra; "no descansaba ni los domingos" es una
 * escena que la lectora reconoce de su propia vida. Van juntas a propósito: la
 * cifra da el tamaño del problema, el domingo da el motivo para resolverlo.
 *
 * Va después de las cifras y antes de los features: primero el porqué, después
 * el cómo.
 */
export function ServinomicRelief({ campaign }: { campaign: Campaign }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <div className="rounded-3xl bg-[#0E7A5F] p-6 text-white sm:p-8">
        <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-3xl">
          {campaign.reliefTitle}
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-white/80">
          {campaign.reliefBody}
        </p>
      </div>
    </section>
  );
}
