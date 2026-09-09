import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Boton } from "@/components/senal/boton";
import { Relojes } from "@/components/senal/relojes";
import { VideoBucle } from "@/components/senal/video-bucle";

/**
 * El mismo cierre al final de todas las páginas.
 *
 * Va en hueso, el papel del sitio. Estuvo en lima y el problema no era el
 * contraste —12,8:1 de sobra— sino la vecindad: encajado entre el azul de las
 * herramientas y el verde hondo del pie, un destello entre dos bloques oscuros
 * hacía que la página no cerrara sino que parpadeara. En hueso el cierre
 * respira y el lima vuelve a ser lo que mejor hace, un acento.
 *
 * El vídeo va al lado y no encima: el texto es lo que pide el clic y tiene que
 * seguir mandando. En un ancho de móvil la columna se parte y el vídeo pasa
 * debajo del botón, donde acompaña sin empujar la invitación fuera de pantalla.
 *
 * Los relojes no son decoración: son la prueba de «estamos en tres husos».
 * Están vivos, así que quien mire ve la hora real de Cali, Frankfurt y Sídney.
 */
export function Cierre() {
  const t = useTranslations("senal.cierre");

  return (
    <Panel fondo="hueso" id="contacto">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_minmax(0,28rem)] md:gap-16">
        <div>
          <p className="mono text-[var(--verde)]">{t("etiqueta")}</p>
          <h2 className="mt-5 max-w-[15ch] text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.0] tracking-[-0.04em] text-balance">
            {t("titular")}
          </h2>
          <p className="mt-6 max-w-[44ch] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.6] opacity-75">
            {t("entrada")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-6">
            <Boton forma="verde" href="/contact">
              {t("boton")}
            </Boton>
            <Relojes
              direccion="columna"
              className="text-[var(--verde)] opacity-80"
              colorAcento="var(--verde)"
            />
          </div>
        </div>

        <VideoBucle
          src="/nuevo/clips/videollamada.mp4"
          poster="/nuevo/clips/videollamada.jpg"
          alt={t("video_alt")}
          className="marco-video w-full max-md:order-last"
        />
      </div>
    </Panel>
  );
}
