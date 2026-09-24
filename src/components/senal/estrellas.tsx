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
 *
 * Se usan en la portada y en la landing «delegar»; cada una elige su tamaño.
 * Los `id` de los degradados llevan un prefijo por instancia para que dos
 * juegos de estrellas en la misma página no se pisen.
 */
export function Estrellas({
  media,
  tamano = "h-8 w-8 md:h-10 md:w-10",
  prefijo = "e",
}: {
  media: number;
  /** Clases de alto y ancho de cada estrella. */
  tamano?: string;
  /** Prefijo de los `id` internos; distinto en cada juego de la misma página. */
  prefijo?: string;
}) {
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
            className={`${tamano} overflow-visible`}
            aria-hidden="true"
          >
            <defs>
              {/* Oro metálico: claro arriba, saturado abajo. */}
              <linearGradient id={`${prefijo}-oro-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3C956" />
                <stop offset="55%" stopColor="#E0A825" />
                <stop offset="100%" stopColor="#C88A16" />
              </linearGradient>
              {/* Corta el oro en el punto exacto de la media; el resto queda
                  en un gris cálido que no compite. */}
              <linearGradient id={`${prefijo}-estrella-${i}`}>
                <stop offset={`${relleno * 100}%`} stopColor={`url(#${prefijo}-oro-${i})`} />
                <stop offset={`${relleno * 100}%`} stopColor="#E7E2D6" />
              </linearGradient>
              <clipPath id={`${prefijo}-corte-${i}`}>
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
                clipPath={`url(#${prefijo}-corte-${i})`}
                fill={`url(#${prefijo}-oro-${i})`}
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
