import { BotonCta } from "@/components/delegar/boton-cta";
import { VideoIntro } from "@/components/delegar/video-intro";
import { NotaCalidev } from "@/components/delegar/nota-calidev";

/**
 * Hero: la propuesta, quién la hace, el botón y el video.
 *
 * Una sola columna, en el teléfono y en el computador: titular → Víctor →
 * nota de clientes → botón → video. El video vertical es alto; si fuera antes,
 * el botón quedaría a dos pantallas. En escritorio se mantiene el mismo formato
 * vertical a propósito, para que la página se lea igual en los dos.
 *
 * El texto explica el servicio solo, sin necesidad de ver el video.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10 pt-7 md:pt-12">
      <div>
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight [text-wrap:balance] md:text-[44px]">
          Tu negocio puede crecer sin que todo dependa de ti.
        </h1>
        <p className="mt-4 text-[17px] font-bold text-[var(--verde)] md:text-[19px]">
          Soy Víctor, de CaliDev.
        </p>
        <p className="mt-2 max-w-[34rem] text-[17px] leading-relaxed text-[#2C3A33] md:text-[18px]">
          Te ayudo a crear procesos, software y sistemas para que tu equipo sepa qué hacer, tú
          puedas delegar y tengas espacio para dirigir, crecer y descansar.
        </p>
        <NotaCalidev />
        <BotonCta className="mt-5" />
        <p className="mt-2.5 text-[14px] text-[#46554D]">
          Cuéntanos sobre tu negocio. La revisión inicial es gratuita.
        </p>
      </div>
      <div className="mt-8">
        <VideoIntro />
      </div>
    </section>
  );
}
