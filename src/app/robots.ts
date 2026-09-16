import { MetadataRoute } from 'next';
import { SITIO } from '@/lib/sitio';

/**
 * El robots.txt.
 *
 * El origen viene de `SITIO` y no de una constante propia: la línea `Sitemap:`
 * caía a victorramosbe.com, el dominio anterior, así que todo rastreador que
 * leyera este archivo salía disparado a buscar el índice del sitio en una casa
 * donde ya no vivimos. Es el peor sitio posible para tener el dominio
 * duplicado, porque es literalmente la primera línea que lee un buscador.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /**
       * `/receipt/` va junto a `/pay/` porque son la misma familia: el enlace
       * de cobro y el recibo del mismo cobro, la misma ruta con `/[id]` y el
       * mismo contenido detrás. `src/app/receipt/[id]/page.tsx` pinta el
       * importe cobrado, la moneda, el número de recibo y los datos del
       * negocio, y no lleva `noindex` propio —renderiza su propio `<html>` sin
       * `export const metadata`—, así que esta lista es lo único que lo tapa.
       *
       * Lo que se protege no es el secreto del id sino la cifra: los ingresos
       * son información privada y no se publican. Un recibo indexado los
       * publica, y basta con que alguien comparta un enlace para que el
       * rastreador lo encuentre sin adivinar nada.
       *
       * `/admin/` y `/api/` están por la razón de siempre: no son páginas que
       * nadie deba encontrar buscando.
       */
      disallow: ['/admin/', '/api/', '/pay/', '/receipt/'],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
