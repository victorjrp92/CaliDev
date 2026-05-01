import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
    name: 'Victor Ramos BE',
    description: 'Digital agency specializing in app development, websites, automations, and digital transformation consulting.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://victorramosbe.com',
    founder: {
      '@type': 'Person',
      name: 'Victor Ramos',
      jobTitle: 'CEO & Digital Strategist',
    },
    serviceType: ['App Development', 'Web Development', 'Business Automation', 'Digital Consulting'],
  };

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <JsonLd data={jsonLd} />
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
