import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { SERVICIOS } from "@/lib/nuevo/servicios";
import { PanelVisual } from "@/components/nuevo/panel-visual";
import { Diferenciales } from "@/components/senal/diferenciales";
import { PruebaSocial } from "@/components/senal/prueba-social";

/**
 * Los servicios como paneles que avanzan en horizontal. El primer panel es la
 * entrada de la sección y va con el fondo hueso de la página, para que el
 * cambio de color empiece a notarse recién en el segundo.
 */
export function Servicios() {
  const t = useTranslations("senal.servicios");
  const locale = useLocale();

  return (
    <HorizontalScroll id="servicios" className="bg-[var(--hueso)]">
      {/* Panel de entrada. Dos columnas en escritorio: el texto ocupaba la
          mitad izquierda y la derecha quedaba en blanco, así que ahí van las
          pastillas y la prueba social. En móvil se apilan debajo. */}
      <article className="flex w-screen flex-none snap-start flex-col justify-center px-7 py-20 md:h-screen md:px-20">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-12 md:flex-row md:items-center md:gap-20">
          <div className="md:flex-1">
            <p className="mono text-[var(--verde)]">{t("etiqueta")}</p>
            {/* El suelo del tamaño depende del ancho: «automatizaciones» no se
                puede partir, y a 2.4rem fijos medía 336 px en una pantalla de
                320. Por encima de 384 px no cambia nada. */}
            <h2 className="mt-6 max-w-[15ch] hyphens-auto text-[clamp(min(2.4rem,10vw),6vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
              {t("titulo")}
            </h2>
            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-[var(--tinta)]/70 md:text-xl">
              {t("entrada")}
            </p>
            {/* Los cuatro, nombrados antes del recorrido. El panel de entrada
                gastaba una pantalla entera en explicar el método sin decir qué
                se puede contratar — y como «Servicios» del menú entra directo
                aquí, para mucha gente esta es la primera pantalla del sitio. */}
            <p className="mono mt-10 text-[var(--verde)]">{t("lista")}</p>
            {/* Dos pistas porque el recorrido es distinto: ancho avanza solo con
                el scroll, móvil apila. La de móvil decía «Desliza →» cuando los
                paneles vivían en una tira horizontal que nadie deslizaba. */}
            <p className="mono mt-6 text-[var(--tinta)]/45 max-md:hidden">{t("pista_ancha")}</p>
            <p className="mono mt-6 text-[var(--tinta)]/45 md:hidden">{t("pista_movil")}</p>
          </div>

          <div className="flex flex-col gap-8 md:flex-1 md:max-w-[30rem]">
            <Diferenciales />
            <PruebaSocial locale={locale} />
          </div>
        </div>
      </article>

      {SERVICIOS.map((s) => (
        <article
          key={s.n}
          className="w-screen flex-none snap-start px-7 py-20 md:h-screen md:px-20"
          style={{ background: s.fondo, color: s.texto }}
        >
          {/* Dos columnas en escritorio; en móvil el visual va debajo del texto,
              donde no compite con el titular en una pantalla estrecha. */}
          <div className="mx-auto flex h-full max-w-[1500px] flex-col justify-center gap-10 md:flex-row md:items-center md:gap-16">
          <div className="max-w-[52ch] md:flex-1">
            {/* Jerarquía invertida. Antes el nombre del servicio iba a 12 px y
                la frase de filosofía a 70: el texto que el ojo lee primero no
                nombraba lo que se vende, y tres de los cuatro titulares no
                contenían ni un sustantivo del negocio. Ahora manda el nombre y
                la frase baja a entradilla — sin cambiar una palabra de ninguna
                de las dos.

                El rótulo dice «Servicios» en cada panel, no solo en el de
                entrada: el título de la sección desaparecía en el segundo paso
                y a partir de ahí nada indicaba qué se estaba leyendo. */}
            <p className="mono" style={{ color: s.realce }}>
              {t("marco", { n: s.n, total: "04" })}
            </p>
            {/* Mismo suelo dependiente del ancho, y partición con guion: el
                alemán encadena palabras que no caben de ninguna manera
                —«Verbesserungsplan» medía 311 px en una caja de 264— y sin
                guion la única salida del navegador es desbordar. */}
            <h3 className="mt-6 hyphens-auto text-[clamp(min(2.1rem,9vw),5.2vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              {t(`s${s.n}.linea`)}
            </h3>
            <p className="mt-5 max-w-[24ch] text-[clamp(1.25rem,2.3vw,1.9rem)] font-medium leading-[1.25] tracking-[-0.02em] opacity-90">
              {t(`s${s.n}.titulo`)}
            </p>
            <p className="mt-6 text-lg leading-relaxed opacity-70 md:text-xl">{t(`s${s.n}.cuerpo`)}</p>
            <ul className="mt-9 flex flex-col gap-3.5">
              {(["p1", "p2", "p3"] as const).map((clave) => (
                <li key={clave} className="flex items-start gap-3.5 text-[17px] leading-snug">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] h-[3px] w-5 flex-none rounded-full"
                    style={{ background: s.realce }}
                  />
                  <span className="opacity-95">{t(`s${s.n}.${clave}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* El flujo se corre a la derecha. Puede hacerlo sin quitarle nada al
              texto: la columna de la izquierda está topada en 52 caracteres y
              ya no crecía más, así que ese margen era lima vacía. */}
          <div
            className={
              "md:w-[38%] md:flex-none" +
              (s.visual.tipo === "workflow" ? " md:ml-[clamp(0px,7vw,140px)]" : "")
            }
          >
            <PanelVisual visual={s.visual} alt={t(`s${s.n}.alt`)} />
          </div>
          </div>
        </article>
      ))}

      {/* Panel de cierre. El botón va en verde, no en lima: el panel anterior
          es una pared de lima y durante la transición se ven los dos a la vez.
          El acento ya tuvo su momento; aquí gana el contraste (11:1) y la calma. */}
      <article className="flex w-screen flex-none snap-start flex-col justify-center px-7 py-20 md:h-screen md:px-20">
        <p className="mono text-[var(--verde)]">{t("cierre_etiqueta")}</p>
        <h2 className="mt-6 max-w-[16ch] hyphens-auto text-[clamp(min(2.4rem,10vw),6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          {t("cierre_titulo")}
        </h2>
        <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-[var(--tinta)]/70 md:text-xl">
          {t("cierre_cuerpo")}
        </p>
        {/* `Link` de next-intl: enruta con el idioma activo. Antes iba fijo a
            `/es/contact`, que mandaba a un lector alemán al sitio en español. */}
        <Link
          href="/contact"
          className="mt-10 inline-block w-fit rounded-full bg-[var(--verde)] px-8 py-4 text-base font-semibold text-[var(--hueso)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--verde)]"
        >
          {t("cierre_boton")}
        </Link>
      </article>
    </HorizontalScroll>
  );
}
