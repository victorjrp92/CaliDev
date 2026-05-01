import { getTranslations } from 'next-intl/server';
import { ServicesContent } from '@/components/services-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });

  return (
    <main className="container mx-auto px-4 py-24 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>
      <ServicesContent />
    </main>
  );
}
