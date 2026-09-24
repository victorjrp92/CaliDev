import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TESTIMONIOS } from "@/lib/nuevo/testimonios";
import { obtenerValoracion } from "@/lib/nuevo/valoracion";
import { Estrellas } from "@/components/senal/estrellas";

/**
 * La nota y las caras, en el panel de entrada de Servicios.
 *
 * Es un componente de servidor `async` porque va a la base a buscar la media
 * real. Se puede anidar dentro de `Servicios`, que no lo es: un componente
 * asíncrono dentro de uno síncrono funciona, y así no hay que convertir la
 * portada entera en asíncrona —la portada usa `useTranslations`, que es un
 * hook y no convive con `async`—.
 *
 * ── Dos bloques, no uno ──
 *
 * Las estrellas y las caras están separadas a propósito, con su propio texto
 * cada una. Las estrellas son de quien CALIFICÓ; las caras son de quien dejó un
 * TESTIMONIO. Hoy no son el mismo grupo —Deisy hizo las dos cosas, Nadia y
 * Laura solo la segunda—, y pegarlas en una sola fila haría leer «cinco
 * estrellas de estas tres», que sería falso. El número de opiniones va siempre
 * junto a la media por lo mismo.
 *
 * Si nadie ha calificado todavía, no hay estrellas y quedan las caras solas.
 */
export async function PruebaSocial({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "senal.diferenciales" });
  const valoracion = await obtenerValoracion();

  /* Centrados bajo el eje de las pastillas, pero solo en escritorio. En móvil
     la columna es única y todo lo de arriba —rótulo, titular, entradilla— va
     alineado a la izquierda: centrar ahí solo estas dos cosas se leería como un
     descuido, no como una decisión. */
  return (
    <div className="flex flex-col gap-7 md:items-center">
      {valoracion && (
        <div className="flex flex-col gap-2.5 md:items-center">
          <Estrellas media={valoracion.media} />
          <p className="mono text-[var(--tinta)]/55">
            {t("nota", { media: formatear(valoracion.media, locale), personas: valoracion.personas })}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5 md:items-center">
        <ul className="flex items-center">
          {TESTIMONIOS.map((persona, i) => (
            <li
              key={persona.id}
              className={i === 0 ? "" : "-ml-2.5"}
              style={{ zIndex: TESTIMONIOS.length - i }}
            >
              <span className="block rounded-full ring-[2.5px] ring-[var(--hueso)]">
                <Cara persona={persona} />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[14px] leading-snug text-[var(--tinta)]/55 md:text-center">
          {t("quienes")}
        </p>
      </div>
    </div>
  );
}

/** Un decimal siempre: «5» se lee como redondeo, «5,0» como una media. */
function formatear(media: number, locale: string): string {
  return media.toLocaleString(locale === "en" ? "en-US" : locale === "de" ? "de-DE" : "es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Las caras se quedan pequeñas: acompañan a las estrellas, no compiten con
 * ellas. Medido: a 34 px quedaban MÁS grandes que las estrellas en móvil (32),
 * que es justo la jerarquía contraria. Sin foto va el monograma, nunca una cara
 * de archivo.
 */
const TAMANO = 28;

function Cara({ persona }: { persona: (typeof TESTIMONIOS)[number] }) {
  if (!persona.foto) {
    return (
      <span
        aria-hidden="true"
        style={{ width: TAMANO, height: TAMANO }}
        className="grid place-items-center rounded-full bg-[#E6E8E3] text-[12px] font-bold text-[var(--verde)]"
      >
        {persona.autor[0]}
      </span>
    );
  }
  return (
    <Image
      src={persona.foto}
      alt={persona.autor}
      width={TAMANO}
      height={TAMANO}
      sizes={`${TAMANO}px`}
      className="block rounded-full object-cover"
      style={{ width: TAMANO, height: TAMANO }}
    />
  );
}
