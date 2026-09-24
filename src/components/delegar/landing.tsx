import "@/styles/delegar.css";
import { Cabecera } from "@/components/delegar/cabecera";
import { Hero } from "@/components/delegar/hero";
import { Caso } from "@/components/delegar/caso";
import { Servicio } from "@/components/delegar/servicio";
import { Despues } from "@/components/delegar/despues";
import { Formulario } from "@/components/delegar/formulario";
import { Detalle } from "@/components/delegar/detalle";
import { PreguntasFrecuentes } from "@/components/delegar/preguntas-frecuentes";
import { Cierre } from "@/components/delegar/cierre";
import { CtaFija } from "@/components/delegar/cta-fija";
import type { Campaign } from "@/lib/campaigns";

/**
 * Landing «Quiero empezar a delegar» (versión A, la de la especificación de
 * Codex, elegida por Víctor el 2026-09-24).
 *
 * El orden es el del documento:
 *  Cabecera   → CaliDev + «Vienes del video de Deisy»
 *  Hero       → propuesta, Víctor, botón y su video
 *  Caso       → las tres cifras de Deisy y una cita
 *  Servicio   → qué se hace, quién, cómo se sabe que va bien
 *  Después    → qué pasa al enviar, antes de pedir nada
 *  Formulario → tres pasos en #registro
 *  Detalle    → cómo se ve por dentro, para quien quiere más
 *  FAQ y cierre
 *
 * La landing anterior (components/servinomic/landing.tsx) sigue en el código:
 * volver a ella es cambiar una línea en la página de la campaña.
 */
export function LandingDelegar({ campaign }: { campaign: Campaign }) {
  return (
    <>
      <Cabecera referencia={campaign.referrer ?? undefined} />
      <main>
        <Hero />
        <Caso />
        <Servicio />
        <Despues />
        <Formulario campaign={campaign.slug} />
        <Detalle />
        <PreguntasFrecuentes />
        <Cierre />
      </main>
      <CtaFija />
    </>
  );
}
