import type { Metadata } from "next";
import { getPathname, routing } from "@/i18n/routing";
import { SITIO } from "@/lib/sitio";

/**
 * La URL canónica de una página, absoluta.
 *
 * Se construye con `getPathname` de next-intl y no a mano porque quien sabe
 * traducir una ruta a cada idioma es el enrutador, no nosotros: el día que este
 * sitio tenga rutas localizadas (`/es/nosotros` en vez de `/es/about`) esto
 * sigue diciendo la verdad sin tocarlo.
 *
 * Absoluta y no relativa aunque `metadataBase` esté puesto: el canonical es la
 * dirección que un buscador guarda como la buena, y dejarla a merced de una
 * base declarada en otro archivo —que además cae a localhost si falta— es
 * demasiado riesgo para la única línea del `<head>` que decide qué URL se
 * indexa. Aquí el origen viene de `SITIO`, el mismo que usan el sitemap y el
 * robots.
 */
export function urlCanonica(locale: string, ruta: string): string {
  return `${SITIO}${getPathname({ href: ruta, locale })}`;
}

type Idiomas = NonNullable<NonNullable<Metadata["alternates"]>["languages"]>;

/**
 * El grupo hreflang de una ruta que sí existe en los tres idiomas.
 *
 * Sale de `routing.locales` y no de una lista escrita a mano para que añadir un
 * cuarto idioma sea una línea en un solo archivo. El `x-default` apunta a la
 * versión en el idioma por defecto —hoy `/en/...`—, que responde 200: es el
 * destino que un buscador ofrece a quien no encaja en ninguno de los tres, y
 * tiene que ser una página de verdad.
 */
function grupoHreflang(ruta: string): Idiomas {
  const idiomas: Idiomas = {};
  for (const idioma of routing.locales) {
    idiomas[idioma] = urlCanonica(idioma, ruta);
  }
  idiomas["x-default"] = urlCanonica(routing.defaultLocale, ruta);
  return idiomas;
}

/**
 * El bloque `alternates` de una página: su canonical y, salvo que se diga lo
 * contrario, su grupo hreflang.
 *
 * Va por página y nunca en una cáscara: `generateMetadata` de un layout solo
 * recibe los parámetros de ruta hasta su propio segmento, así que `[locale]`
 * sabe el idioma pero no si está sirviendo la home o un artículo. Un canonical
 * puesto ahí le pondría la misma dirección a las seis páginas, que es peor que
 * no tener ninguno.
 *
 * Y va COMPLETO en cada llamada: la fusión de metadatos de Next es superficial,
 * de modo que el `alternates` de la página reemplaza entero al del padre en vez
 * de mezclarse con él. Repartir `canonical` aquí y otra clave más arriba haría
 * desaparecer la de arriba en silencio.
 *
 * Esta función es HOY la única fuente del hreflang del sitio. Antes lo emitía
 * también el middleware de next-intl en una cabecera HTTP `Link`, y las dos
 * versiones no decían lo mismo: la de la cabecera daba por `x-default` rutas sin
 * prefijo de idioma (`/about`, `/blog`, `/contact`, `/blog/<slug>`) que
 * devuelven 404. Esa cabecera está apagada desde `src/i18n/routing.ts`
 * (`alternateLinks: false`) y el motivo largo está allí; lo que importa aquí es
 * que no hay un segundo juego con el que contradecirse.
 *
 * `idiomas: false` es para las rutas que NO tienen tres versiones. Un miembro de
 * un grupo hreflang tiene que ser autocanónico —las tres URLs se avalan entre
 * ellas—, así que una página cuyo canonical apunta a otro idioma no puede
 * declarar el grupo sin invalidarlo entero. Hoy el único caso es el artículo del
 * blog; ver el comentario de `src/app/[locale]/blog/[slug]/page.tsx`.
 */
export function alternatesDe(
  locale: string,
  ruta: string,
  { idiomas = true }: { idiomas?: boolean } = {}
): Metadata["alternates"] {
  return {
    canonical: urlCanonica(locale, ruta),
    ...(idiomas ? { languages: grupoHreflang(ruta) } : {}),
  };
}
