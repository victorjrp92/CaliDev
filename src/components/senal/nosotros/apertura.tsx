import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Titular } from "@/components/senal/titular";
import { Duotono } from "@/components/senal/duotono";

/**
 * Apertura de Nosotros. Fondo verde, como todas las páginas interiores: es lo
 * que hace que la barra sepa que arriba hay oscuro y ponga su texto en hueso.
 */
export function Apertura() {
  const t = useTranslations("about");

  return (
    <Panel fondo="verde">
      <Titular etiqueta="Nosotros" nivel="h1" entrada={t("subheadline")}>
        {t("headline")}
      </Titular>

      <Duotono
        src="/hero/poster.jpg"
        alt="El equipo de CaliDev trabajando alrededor de una mesa, de espaldas, con Cali al fondo"
        ancho={1600}
        alto={500}
        sizes="(min-width: 1024px) 72rem, 100vw"
        className="mt-14 aspect-[16/5] w-full rounded-2xl"
      />
    </Panel>
  );
}
