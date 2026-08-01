import type { Campaign } from "@/lib/campaigns";

/**
 * Banda de cifras del caso.
 *
 * Va inmediatamente después del testimonio para que la afirmación de Deisy
 * aterrice en números: el patrón de prueba con mayor lift medido es la
 * afirmación concreta con cifra y nombre, no la promesa general.
 *
 * Todas las cifras son relativas a propósito. En Colombia publicar los ingresos
 * o las utilidades de una empresa es información delicada, y el crecimiento
 * porcentual dice lo mismo sin exponer al cliente.
 *
 * El enlace al sitio del cliente es la única excepción a la regla de "cero
 * enlaces de salida": es prueba verificable de que el caso es real y de que
 * también construimos su web. Abre en pestaña nueva.
 */
export function ServinomicProof({ campaign }: { campaign: Campaign }) {
  return (
    <section className="border-y border-[#E7E1D7] bg-white py-7">
      <div className="mx-auto max-w-xl px-5">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.06em] text-[#87938C]">
          Lo que cambió en {campaign.clientName}
        </p>

        <dl className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-4">
          {campaign.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-[27px] font-extrabold tracking-tight text-[#0E7A5F]">
                  {stat.value}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[#4A5A53]">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {campaign.clientSite && (
          <p className="mt-6 border-t border-[#E7E1D7] pt-4 text-center text-[13.5px] leading-relaxed text-[#4A5A53]">
            {campaign.clientSite.intro}{" "}
            <a
              href={campaign.clientSite.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0E7A5F] underline underline-offset-2"
            >
              {campaign.clientSite.label}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
