import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { routing } from '@/i18n/routing';
import { SITIO } from '@/lib/sitio';

type Frecuencia = MetadataRoute.Sitemap[number]['changeFrequency'];

/**
 * Las páginas fijas que anunciamos, en los tres idiomas.
 *
 * Falta `/services` a propósito: devuelve un 307 hacia `/{idioma}#servicios`
 * —el redirect es deliberado, ver `src/app/[locale]/services/page.tsx`, y ahí
 * se queda— y aquí estaba listada a prioridad 0.8. Un sitemap es la lista de lo
 * que queremos que se indexe, y una URL que redirige no se indexa jamás: solo
 * gasta presupuesto de rastreo y deja por escrito que no sabemos qué tenemos
 * publicado. Sobra `/about`, que responde 200 y explica quiénes somos, y no
 * estaba en ningún idioma.
 *
 * La frecuencia y la prioridad se piensan por página en vez de copiarse de la
 * fila de al lado. La portada se mueve cuando se mueve la oferta; el índice del
 * blog, cuando se publica algo —y el ritmo real de publicación es de semanas,
 * no de días—; contacto y nosotros no cambian casi nunca. Jurar `weekly` en una
 * página que lleva meses idéntica es la misma mentira que anunciar un redirect,
 * solo que más difícil de ver.
 */
const PAGINAS: ReadonlyArray<{ ruta: string; frecuencia: Frecuencia; prioridad: number }> = [
  { ruta: '', frecuencia: 'monthly', prioridad: 1.0 },
  { ruta: '/blog', frecuencia: 'monthly', prioridad: 0.8 },
  { ruta: '/contact', frecuencia: 'yearly', prioridad: 0.7 },
  { ruta: '/about', frecuencia: 'yearly', prioridad: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  /**
   * Sin `lastModified`. Antes era `new Date()`, o sea la hora de compilar: cada
   * despliegue juraba que las doce páginas habían cambiado aunque no se hubiera
   * tocado una coma. Un lastmod que miente siempre se acaba descartando entero,
   * y de paso se lleva por delante el de los artículos, que ese sí es cierto.
   * Callar es más honesto que inventarse una fecha.
   */
  const fijas = routing.locales.flatMap(idioma =>
    PAGINAS.map(({ ruta, frecuencia, prioridad }) => ({
      url: `${SITIO}/${idioma}${ruta}`,
      changeFrequency: frecuencia,
      priority: prioridad,
    }))
  );

  /**
   * `getAllPosts` SIEMPRE con idioma. Sin argumento cae al inglés por defecto
   * (ver `src/lib/blog.ts`), y como además filtra, lo que salía de aquí era el
   * mundo al revés: los cuatro artículos ingleses anunciados bajo `/es/` y
   * `/de/` como si estuvieran traducidos, y el único artículo en español que
   * existe sin aparecer en ningún sitemap. Prometerle a Google una traducción
   * que no existe es la manera más rápida de que deje de creerse el resto.
   *
   * Que hoy `de` no aporte ninguna entrada no es un fallo: todavía no hay un
   * solo artículo en alemán. `/de/blog` sí se anuncia, porque la página existe
   * y ofrece los textos de otros idiomas señalados como tales.
   */
  const articulos = routing.locales.flatMap(idioma =>
    getAllPosts(idioma).map(articulo => ({
      url: `${SITIO}/${idioma}/blog/${articulo.slug}`,
      // La fecha sale del frontmatter; si algún artículo se quedara sin ella,
      // omitimos el campo en vez de emitir un `Invalid Date` que rompe el XML.
      lastModified: articulo.date ? new Date(articulo.date) : undefined,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    }))
  );

  return [...fijas, ...articulos];
}
