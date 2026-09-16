import type { Metadata } from "next";
import { ServinomicLanding } from "@/components/servinomic/landing";
import { getCampaign } from "@/lib/campaigns";
import { SITIO } from "@/lib/sitio";

/** Página canónica: la que alguien escribe de memoria o se enlaza desde el sitio. */
const campaign = getCampaign("directo");

export const metadata: Metadata = {
  title: "ServiNomic — El sistema de operación para empresas de servicios",
  description: campaign.subhead,
  /**
   * Era la única página pública indexable del sitio sin canonical: las quince
   * de `[locale]` lo traen y esta salía vacía. Sin él, cualquier dirección que
   * llegue con basura detrás —los `?utm_source` de los anuncios, que es
   * justamente cómo se reparte esta landing— se indexa como una página
   * distinta, y el ranking se reparte entre copias en vez de sumarse en una.
   *
   * A mano con `SITIO` y no con `urlCanonica`: esa función construye la ruta
   * con `getPathname` de next-intl, que antepone el prefijo de idioma, y
   * `/servinomic` vive fuera del árbol de locales —tiene su propio layout y su
   * propio `<html lang="es">`—. Pasar por ahí emitiría `/es/servinomic`, una
   * URL que no existe: un canonical a un 404 es peor que no tener ninguno.
   *
   * Absoluto y no relativo por lo mismo que en `canonica.ts`: `metadataBase`
   * se declara en otro archivo y cae a localhost si falta, y esta es la única
   * línea del `<head>` que decide qué dirección se guarda como la buena.
   *
   * Esto NO se propaga a `[campana]/page.tsx`: esas llevan `index: false` a
   * propósito para no competir con esta, y un canonical allí no pinta nada.
   */
  alternates: { canonical: `${SITIO}/servinomic` },
};

export default function ServinomicPage() {
  return <ServinomicLanding campaign={campaign} />;
}
