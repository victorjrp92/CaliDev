import Link from "next/link";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { SERVICIOS } from "@/lib/nuevo/servicios";
import { PanelVisual } from "@/components/nuevo/panel-visual";

/**
 * Los servicios como paneles que avanzan en horizontal. El primer panel es la
 * entrada de la sección y va con el fondo hueso de la página, para que el
 * cambio de color empiece a notarse recién en el segundo.
 */
export function Servicios() {
  return (
    <HorizontalScroll className="bg-[var(--hueso)]">
      {/* Panel de entrada */}
      <article className="flex w-screen flex-none snap-start flex-col justify-center px-7 py-20 md:h-screen md:px-20">
        <p className="mono text-[var(--verde)]">Qué hacemos</p>
        <h2 className="mt-6 max-w-[15ch] text-[clamp(2.4rem,6.5vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          Cuatro maneras de trabajar juntos.
        </h2>
        <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-[var(--tinta)]/70 md:text-xl">
          Siempre en ese orden: primero entender, después construir. Lo que se
          construye depende de lo que el análisis encuentre, no de lo que
          queramos vender.
        </p>
        <p className="mono mt-10 text-[var(--tinta)]/45 max-md:hidden">
          Sigue bajando · los paneles avanzan solos
        </p>
        <p className="mono mt-10 text-[var(--tinta)]/45 md:hidden">
          Desliza →
        </p>
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
            <p className="mono" style={{ color: s.realce }}>
              {s.n} · {s.linea}
            </p>
            <h3 className="mt-6 text-[clamp(2.1rem,5.2vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              {s.titulo}
            </h3>
            <p className="mt-6 text-lg leading-relaxed opacity-80 md:text-xl">{s.cuerpo}</p>
            <ul className="mt-9 flex flex-col gap-3.5">
              {s.puntos.map((p) => (
                <li key={p} className="flex items-start gap-3.5 text-[17px] leading-snug">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] h-[3px] w-5 flex-none rounded-full"
                    style={{ background: s.realce }}
                  />
                  <span className="opacity-95">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-[38%] md:flex-none">
            <PanelVisual visual={s.visual} alt={s.visualAlt} />
          </div>
          </div>
        </article>
      ))}

      {/* Panel de cierre. El botón va en verde, no en lima: el panel anterior
          es una pared de lima y durante la transición se ven los dos a la vez.
          El acento ya tuvo su momento; aquí gana el contraste (11:1) y la calma. */}
      <article className="flex w-screen flex-none snap-start flex-col justify-center px-7 py-20 md:h-screen md:px-20">
        <p className="mono text-[var(--verde)]">Y entonces</p>
        <h2 className="mt-6 max-w-[16ch] text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          ¿Cuál de las cuatro es la tuya?
        </h2>
        <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-[var(--tinta)]/70 md:text-xl">
          Treinta minutos, sin presentación de ventas. Nos cuentas cómo funciona
          tu operación hoy y te decimos honestamente si podemos ayudarte.
        </p>
        {/* El sitio actual vive bajo /[locale]; sin el prefijo esta ruta da 404.
            Provisional hasta que se decida el contacto del home nuevo. */}
        <Link
          href="/es/contact"
          className="mt-10 inline-block w-fit rounded-full bg-[var(--verde)] px-8 py-4 text-base font-semibold text-[var(--hueso)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--verde)]"
        >
          Hablemos
        </Link>
      </article>
    </HorizontalScroll>
  );
}
