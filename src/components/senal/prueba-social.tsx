import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TESTIMONIOS } from "@/lib/nuevo/testimonios";
import { obtenerValoracion } from "@/lib/nuevo/valoracion";

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

  return (
    <div className="flex flex-col gap-7">
      {valoracion && (
        <div className="flex flex-col gap-2.5">
          <Estrellas media={valoracion.media} />
          <p className="mono text-[var(--tinta)]/55">
            {t("nota", { media: formatear(valoracion.media, locale), personas: valoracion.personas })}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
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
        <p className="text-[14px] leading-snug text-[var(--tinta)]/55">{t("quienes")}</p>
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
 * Estrellas grandes y doradas: son el primer golpe de vista del bloque, y a
 * 15 px verdes se perdían contra un titular de 88.
 *
 * El dorado se eligió midiendo, no a ojo. Contra el fondo hueso (#FAFAF7) los
 * dorados brillantes no llegan al 3:1 que pide un elemento gráfico —#E0A825 da
 * 2,05 y #D4A017 da 2,27—, y los que sí pasan son marrones apagados que no
 * parecen oro. La salida es relleno brillante MÁS un filo oscuro: el relleno
 * da el valor percibido y el contorno (#A9761B, 3,79:1) da la definición que
 * el relleno solo no alcanza. El degradado vertical es lo que hace que se lea
 * como metal y no como un triángulo amarillo.
 *
 * Se dibujan a la media exacta, con media estrella cuando toca — redondear 4,7
 * a cinco llenas sería inventar la nota por la puerta de atrás.
 */
function Estrellas({ media }: { media: number }) {
  return (
    <span
      className="flex gap-1.5"
      role="img"
      aria-label={`${media} de 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const relleno = Math.max(0, Math.min(1, media - i));
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className="h-8 w-8 md:h-10 md:w-10 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              {/* Oro metálico: claro arriba, saturado abajo. */}
              <linearGradient id={`oro-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3C956" />
                <stop offset="55%" stopColor="#E0A825" />
                <stop offset="100%" stopColor="#C88A16" />
              </linearGradient>
              {/* Corta el oro en el punto exacto de la media; el resto queda
                  en un gris cálido que no compite. */}
              <linearGradient id={`estrella-${i}`}>
                <stop offset={`${relleno * 100}%`} stopColor={`url(#oro-${i})`} />
                <stop offset={`${relleno * 100}%`} stopColor="#E7E2D6" />
              </linearGradient>
              <clipPath id={`corte-${i}`}>
                <rect x="0" y="0" width={20 * relleno} height="20" />
              </clipPath>
            </defs>
            {/* Dos capas en vez de un degradado con url() dentro de otro —eso
                no lo resuelven todos los navegadores—: el vacío debajo y el oro
                recortado encima. */}
            <path
              fill="#E7E2D6"
              stroke="#CFC8B6"
              strokeWidth="0.7"
              strokeLinejoin="round"
              d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6 4.8 17.5 6 11.7 1.6 7.7l5.9-.7z"
            />
            {relleno > 0 && (
              <path
                clipPath={`url(#corte-${i})`}
                fill={`url(#oro-${i})`}
                stroke="#A9761B"
                strokeWidth="0.7"
                strokeLinejoin="round"
                d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6 4.8 17.5 6 11.7 1.6 7.7l5.9-.7z"
              />
            )}
          </svg>
        );
      })}
    </span>
  );
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
