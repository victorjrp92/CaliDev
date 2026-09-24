import { BotonCta } from "@/components/delegar/boton-cta";
import { VideoIntro } from "@/components/delegar/video-intro";

/**
 * Hero: la propuesta, quién la hace, el botón y el video.
 *
 * En móvil el orden es titular → Víctor → botón → video: el video vertical es
 * alto, y si fuera antes el botón quedaría a dos pantallas. En escritorio el
 * texto va a la izquierda y el video a la derecha, a su ancho natural.
 *
 * El texto explica el servicio solo, sin necesidad de ver el video.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-10 pt-7 md:grid md:grid-cols-[1fr_380px] md:items-center md:gap-14 md:pb-16 md:pt-14">
      <div>
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight [text-wrap:balance] md:text-[52px]">
          Tu negocio puede crecer sin que todo dependa de ti.
        </h1>
        <p className="mt-4 text-[17px] font-bold text-[var(--verde)] md:text-[19px]">
          Soy Víctor, de CaliDev.
        </p>
        <p className="mt-2 max-w-[34rem] text-[17px] leading-relaxed text-[#2C3A33] md:text-[18px]">
          Te ayudo a crear procesos, software y sistemas para que tu equipo sepa qué hacer, tú
          puedas delegar y tengas espacio para dirigir, crecer y descansar.
        </p>
        <BotonCta className="mt-6 md:max-w-sm" />
        <p className="mt-2.5 text-[14px] text-[#46554D]">
          Cuéntanos sobre tu negocio. La revisión inicial es gratuita.
        </p>
      </div>
      <div className="mt-8 md:mt-0">
        <VideoIntro />
      </div>
    </section>
  );
}
