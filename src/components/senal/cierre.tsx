import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Boton } from "@/components/senal/boton";
import { Relojes } from "@/components/senal/relojes";

/**
 * El mismo cierre al final de todas las páginas.
 *
 * Va en lima porque es el único panel que grita, y grita una sola vez por
 * página: el resto de la paleta se reserva para leer. Sobre lima el texto es
 * tinta (12,8:1) y el botón se invierte a tinta con texto lima — un botón lima
 * sobre fondo lima no existiría.
 *
 * Los relojes no son decoración: son la prueba de «estamos en tres husos».
 * Están vivos, así que quien mire ve la hora real de Cali, Frankfurt y Sídney.
 */
export function Cierre() {
  const t = useTranslations("senal.cierre");

  return (
    <Panel fondo="lima" id="contacto">
      <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
        <div>
          <p className="mono opacity-70">{t("etiqueta")}</p>
          <h2 className="mt-6 max-w-[15ch] text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-balance">
            {t("titular")}
          </h2>
          <p className="mt-6 max-w-[46ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.6] opacity-80">
            {t("entrada")}
          </p>
          <Boton forma="invertido" href="/contact" className="mt-9">
            {t("boton")}
          </Boton>
        </div>

        <Relojes className="opacity-60" colorAcento="var(--tinta)" />
      </div>
    </Panel>
  );
}
