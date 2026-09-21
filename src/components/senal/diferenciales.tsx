import Image from "next/image";
import { useTranslations } from "next-intl";
import { TESTIMONIOS } from "@/lib/nuevo/testimonios";
import { VALORACION } from "@/lib/nuevo/valoracion";

/**
 * La banda de diferenciales, justo donde termina el hero.
 *
 * Va aquí y no dentro del hero por sitio: en un iPhone 13 el hero ya ocupa sus
 * 664 px exactos con el titular, la entradilla, el botón, el vídeo y las dos
 * palabras de abajo. Meterla dentro empujaba «ventaja» fuera de pantalla en los
 * móviles bajos, y además obligaba a tocar un anclaje de GSAP que costó dos
 * arreglos esta misma semana. Aquí cabe entera, es un solo diseño para todos
 * los teléfonos, y llega en el primer respiro después de que el vídeo termina
 * de abrirse.
 *
 * Las cuatro pastillas dicen el valor sin pedir contexto: quien entra por
 * primera vez no sabe quiénes somos, así que no sirve un badge que haya que
 * descifrar. «No se rompe a los seis meses» hace el trabajo de contar que los
 * sistemas los firma una ingeniera sin que nadie tenga que saber quién es.
 *
 * Las caras son las de las tres clientas que ya están en los testimonios de más
 * abajo. Aquí solo van la cara y el nombre; las palabras se leen enteras luego.
 */
export function Diferenciales() {
  const t = useTranslations("senal.diferenciales");
  const pastillas = t.raw("pastillas") as string[];

  return (
    <section className="border-y border-[#E1E4DE] bg-white px-6 py-8 md:py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5">
        <ul className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          {pastillas.map((texto, i) => (
            <li
              key={texto}
              className={`rounded-full px-3 py-[7px] text-[11.5px] font-semibold leading-tight tracking-[-0.005em] md:text-[13px] md:px-4 md:py-2 ${
                // La primera en verde sólido y el resto bajando de peso: son
                // cuatro y todas al mismo tono se leen como una lista que nadie
                // termina. La lima no aparece — sobre fondo claro no llega a
                // 1,5:1 y no puede llevar texto encima.
                i === 0
                  ? "bg-[var(--verde)] text-[var(--hueso)]"
                  : i === 3
                    ? "text-[var(--verde-hondo)] ring-[1.4px] ring-inset ring-[#D8DCD4]"
                    : "bg-[#E6E8E3] text-[var(--verde-hondo)]"
              }`}
            >
              {texto}
            </li>
          ))}
        </ul>

        <PruebaSocial quienes={t("quienes")} nota={t} />
      </div>
    </section>
  );
}

/**
 * La nota encima y las caras debajo.
 *
 * En ese orden porque las estrellas dicen «cuánto» y las caras «quién», y lo
 * general se lee antes que lo particular. De paso la fila de caras queda entera
 * en vez de partirse en dos en una pantalla estrecha.
 *
 * Si no hay valoración real, no hay estrellas: quedan las caras, que ya son
 * prueba de sobra porque son personas con nombre. Ver `lib/nuevo/valoracion.ts`.
 */
function PruebaSocial({
  quienes,
  nota,
}: {
  quienes: string;
  nota: (clave: string, valores?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      {VALORACION && (
        <div className="flex items-center gap-2.5">
          <Estrellas media={VALORACION.media} />
          <span className="mono text-[11.5px] text-[#77847C]">
            {nota("nota", {
              media: VALORACION.media.toLocaleString("es-CO", {
                minimumFractionDigits: 1,
              }),
              personas: VALORACION.personas,
            })}
          </span>
        </div>
      )}

      <ul className="flex items-center">
        {TESTIMONIOS.map((persona, i) => (
          <li
            key={persona.id}
            className={i === 0 ? "" : "-ml-2.5"}
            style={{ zIndex: TESTIMONIOS.length - i }}
          >
            {i === 0 ? (
              // La primera va abierta en pastilla con su nombre y las demás
              // encogidas: una fila de círculos iguales no dice quién es nadie,
              // y con un nombre a la vista deja de ser un adorno.
              <span className="flex items-center gap-2 rounded-full bg-[var(--tinta)] py-[3px] pl-[3px] pr-3.5 text-[var(--hueso)] ring-2 ring-white">
                <Cara persona={persona} tamano={26} />
                <b className="text-[12px] font-semibold tracking-[-0.01em]">
                  {persona.autor.split(" ")[0]}
                </b>
              </span>
            ) : (
              <span className="block rounded-full ring-2 ring-white">
                <Cara persona={persona} tamano={30} />
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="text-center text-[11.5px] leading-snug text-[#77847C]">
        {quienes}
      </p>
    </div>
  );
}

/** Sin foto se pinta el monograma, nunca una cara de archivo. */
function Cara({
  persona,
  tamano,
}: {
  persona: (typeof TESTIMONIOS)[number];
  tamano: number;
}) {
  if (!persona.foto) {
    return (
      <span
        aria-hidden="true"
        style={{ width: tamano, height: tamano }}
        className="grid place-items-center rounded-full bg-[#E6E8E3] text-[11px] font-bold text-[var(--verde)]"
      >
        {persona.autor[0]}
      </span>
    );
  }
  return (
    <Image
      src={persona.foto}
      alt={persona.autor}
      width={tamano}
      height={tamano}
      sizes={`${tamano}px`}
      className="block rounded-full object-cover"
      style={{ width: tamano, height: tamano }}
    />
  );
}

/**
 * Estrellas dibujadas a la media real, con media estrella cuando toca.
 *
 * Redondear 4,7 a cinco estrellas llenas sería volver a inventar la nota por la
 * puerta de atrás, así que el relleno se recorta al porcentaje exacto.
 */
function Estrellas({ media }: { media: number }) {
  return (
    <span
      className="flex gap-[3px]"
      role="img"
      aria-label={`${media.toLocaleString("es-CO", { minimumFractionDigits: 1 })} de 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const relleno = Math.max(0, Math.min(1, media - i));
        return (
          <svg key={i} viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden="true">
            <defs>
              <linearGradient id={`e${i}`}>
                <stop offset={`${relleno * 100}%`} stopColor="var(--verde)" />
                <stop offset={`${relleno * 100}%`} stopColor="#D8DCD4" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#e${i})`}
              d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6 4.8 17.5 6 11.7 1.6 7.7l5.9-.7z"
            />
          </svg>
        );
      })}
    </span>
  );
}
