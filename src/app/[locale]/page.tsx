import type { Metadata } from 'next';
import { WorkPageHero } from '@/components/ui/work-page-hero';
import { Servicios } from '@/components/nuevo/servicios';
import { Testimonios } from '@/components/nuevo/testimonios';
import { Herramientas } from '@/components/nuevo/herramientas';
import { Cierre } from '@/components/senal/cierre';
import { SaltoAncla } from '@/components/senal/salto-a-ancla';

export const metadata: Metadata = {
  title: 'CaliDev — Construimos tu ventaja',
  description:
    'Consultoría de estrategia digital y de negocio. Analizamos la operación, encontramos dónde se pierde tiempo y dinero, y construimos el sistema que lo arregla.',
  openGraph: {
    title: 'CaliDev — Construimos tu ventaja',
    description:
      'Analizamos la operación, encontramos dónde se pierde tiempo y dinero, y construimos el sistema que lo arregla.',
    type: 'website',
    images: ['/hero/poster.jpg'],
  },
};

/**
 * Home: el hero con el vídeo que se expande, los servicios avanzando en
 * horizontal, los testimonios, las herramientas orbitando y el cierre.
 *
 * `SaltoAncla` va aquí y no en la cáscara porque es la única página con
 * secciones ancladas por GSAP, que es lo que descoloca el salto nativo del
 * navegador.
 */
export default function HomePage() {
  return (
    <main>
      <SaltoAncla />

      <WorkPageHero
        videoSrc="/hero/loop.mp4"
        poster="/hero/poster.jpg"
        playbackRate={0.8}
        topWord="construimos"
        rightWord="tu"
        bottomWord="ventaja"
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

      <Servicios />
      <Testimonios />
      <Herramientas />
      <Cierre />
    </main>
  );
}
