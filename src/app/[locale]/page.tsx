import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { alternatesDe, urlCanonica } from '@/lib/canonica';
import { WorkPageHero } from '@/components/ui/work-page-hero';
import { Diferenciales } from '@/components/senal/diferenciales';
import { Servicios } from '@/components/nuevo/servicios';
import { Testimonios } from '@/components/nuevo/testimonios';
import { Herramientas } from '@/components/nuevo/herramientas';
import { Cierre } from '@/components/senal/cierre';
import { SaltoAncla } from '@/components/senal/salto-a-ancla';

/**
 * Los metadatos de la home eran una constante en español, y por tanto `/en` y
 * `/de` se anunciaban en Google en español: el resto del sitio ya traducía sus
 * títulos y solo esta página se quedaba fuera, que es la que más visitas
 * recibe. Ahora salen de `meta.home`, como cualquier otro texto del sitio.
 *
 * El título ya no empieza por «CaliDev». La plantilla del layout raíz añade
 * « | CaliDev» a todo, así que el nombre salía dos veces y se comía diez de los
 * sesenta caracteres que un buscador enseña; los diez que valen son los que
 * dicen a qué nos dedicamos con las palabras que la gente escribe al buscar.
 * En Open Graph sí va la marca —ahí no hay plantilla ni resultado que recortar,
 * hay una tarjeta compartida—, y por eso ese título va como `absolute`: sin esa
 * marca, la plantilla también se le aplicaría y volvería el nombre repetido.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });

  return {
    title: t('titulo'),
    description: t('descripcion'),
    alternates: alternatesDe(locale, '/'),
    openGraph: {
      title: { absolute: t('og_titulo') },
      description: t('descripcion'),
      type: 'website',
      url: urlCanonica(locale, '/'),
      images: ['/hero/poster.jpg'],
    },
  };
}

/**
 * Home: el hero con el vídeo que se expande, los servicios avanzando en
 * horizontal, los testimonios, las herramientas orbitando y el cierre.
 *
 * `SaltoAncla` va aquí y no en la cáscara porque es la única página con
 * secciones ancladas por GSAP, que es lo que descoloca el salto nativo del
 * navegador.
 */
export default function HomePage() {
  const t = useTranslations('senal.hero');

  return (
    <main>
      <SaltoAncla />

      <WorkPageHero
        videoSrc="/hero/loop.mp4"
        poster="/hero/poster.jpg"
        playbackRate={0.8}
        topWord={t('palabra1')}
        rightWord={t('palabra2')}
        bottomWord={t('palabra3')}
        tagline={t('linea')}
        ctaTexto={t('cta')}
        accentColor="#0A3D2E"
        textColor="#14201B"
        backgroundColor="#FAFAF7"
        liveColor="#C8F045"
        clocks={[
          { tz: 'America/Bogota', label: 'CALI' },
          { tz: 'Europe/Berlin', label: 'FRANKFURT' },
          { tz: 'Australia/Sydney', label: 'SÍDNEY' },
        ]}
      />

      {/* Justo al salir del anclaje del hero: el primer respiro después de que
          el vídeo termina de abrirse, y antes de entrar a los servicios. */}
      <Diferenciales />

      <Servicios />
      <Testimonios />
      <Herramientas />
      <Cierre />
    </main>
  );
}
