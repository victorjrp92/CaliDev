import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Barra } from '@/components/senal/barra';
import { Pie } from '@/components/senal/pie';
import { JsonLd } from '@/components/json-ld';
import '@/styles/senal.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  weight: ['400', '500', '600', '800'],
  display: 'swap',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex',
  weight: ['400', '500'],
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument',
  weight: '400',
  style: 'italic',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Cáscara SEÑAL de todo el sitio público.
 *
 * No lleva `ThemeProvider`: SEÑAL es una identidad comprometida, no una
 * preferencia — el verde es la marca. Mantener claro y oscuro obligaría a
 * definir cada panel dos veces y a resolver el contraste dos veces, para un
 * conmutador que en una web de agencia casi nadie toca. El panel `/admin`
 * conserva el suyo, que ahí sí se agradece.
 *
 * La barra es fija y flota sobre el contenido; las páginas no llevan hueco
 * reservado porque el margen superior de los paneles (96 px en móvil, 128 px en
 * escritorio) ya supera el alto de la barra (64 / 80 px). El oráculo de
 * alcanzabilidad vigila que siga siendo cierto.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'CaliDev',
    description:
      'Consultoría de estrategia digital y de negocio: sistemas de operaciones, aplicaciones, sitios web y automatizaciones.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://calidev.dev',
    serviceType: [
      'Business Strategy Consulting',
      'App Development',
      'Web Development',
      'Business Automation',
    ],
    areaServed: ['CO', 'DE', 'AU'],
  };

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${plex.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="senal flex min-h-full flex-col bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)]">
        <NextIntlClientProvider messages={messages}>
          <JsonLd data={jsonLd} />
          <Barra />
          <div className="flex-1">{children}</div>
          <Pie />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
