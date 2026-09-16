import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * `alternateLinks: false` apaga la cabecera HTTP `Link` con el grupo hreflang
 * que el middleware de next-intl emite por defecto.
 *
 * La opción existe y es exactamente ésta en next-intl 4.11: está declarada como
 * `alternateLinks?: boolean` en `routing/config.d.ts`, cae a `true` cuando no se
 * pasa (`receiveRoutingConfig`), y el único sitio del paquete que la lee es el
 * middleware, en la línea que hace `headers.set("Link", ...)`. Apagarla no toca
 * el enrutado, ni la cookie de idioma, ni la detección de idioma, ni nada de lo
 * que `createNavigation` usa aquí abajo: solo deja de escribirse esa cabecera.
 *
 * Se apaga porque mentía. El generador de la cabecera normaliza la ruta —le
 * quita el prefijo de idioma— y publica esa versión desnuda como `x-default`:
 * `/about`, `/blog`, `/contact`, `/blog/<slug>`. Ninguna de esas cuatro existe:
 * el `matcher` de `src/middleware.ts` solo atiende `/` y `/(en|es|de)/:path*`,
 * así que la petición cae en `[locale]` con `locale = "about"`, la cáscara no lo
 * reconoce y responde 404. Le estábamos diciendo a Google que la versión por
 * defecto de cuatro familias de rutas no existe. Y la única de la home que sí
 * responde, `https://calidev.dev/`, responde con un redirect, que como x-default
 * tampoco vale gran cosa.
 *
 * next-intl no deja corregir ese x-default: la cabecera se enciende o se apaga
 * entera, no hay gancho para reescribirla. Así que el hreflang pasa a emitirse
 * en el `<head>`, desde `alternatesDe` en `src/lib/canonica.ts`, que sí sabe qué
 * rutas tienen de verdad tres versiones y cuál es la canónica de cada una. Una
 * sola fuente: dos juegos de anotaciones que no coinciden valen menos que uno.
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'de'],
  defaultLocale: 'en',
  alternateLinks: false
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
