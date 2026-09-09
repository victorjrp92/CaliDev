import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ContactForm } from '@/components/contact-form';
import { Panel } from '@/components/senal/panel';
import { Relojes } from '@/components/senal/relojes';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('subtitle') };
}

/**
 * Qué pasa después de escribir.
 *
 * Aquí los números SÍ son información: es una secuencia real y saber que hay
 * tres pasos y no una espera indefinida es justo lo que quita el miedo a
 * escribir. (En «Nosotros» los principios van sin numerar por lo contrario:
 * allí no hay orden que prometer.)
 */
function Pasos() {
  const t = useTranslations('contact');
  const pasos = [1, 2, 3].map((n) => ({
    n,
    titulo: t(`paso${n}_titulo`),
    desc: t(`paso${n}_desc`),
  }));

  return (
    <Panel fondo="niebla">
      <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
        {t('pasos_titulo')}
      </h2>
      <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {pasos.map((p) => (
          <li key={p.n} className="border-t-2 border-[var(--verde)] pt-6">
            <span className="mono text-[var(--verde)]">{String(p.n).padStart(2, '0')}</span>
            <h3 className="mt-4 text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.02em]">
              {p.titulo}
            </h3>
            <p className="mt-3 text-[1.0625rem] leading-[1.65] opacity-75">{p.desc}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <main>
      <Panel fondo="verde">
        <div className="grid gap-14 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-20">
          <div>
            <p className="mono text-[var(--lima)]">{t('title')}</p>
            <h1 className="mt-6 max-w-[16ch] text-[clamp(2.2rem,5.5vw,4.2rem)] font-extrabold leading-[1.0] tracking-[-0.035em] text-balance">
              {t('subtitle')}
            </h1>
            <Relojes className="mt-12 opacity-70" />
          </div>

          {/* `useSearchParams` obliga a un límite de Suspense: sin él, toda la
              página se vuelve dinámica y pierde el prerenderizado. */}
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </Panel>

      <Pasos />
    </main>
  );
}
