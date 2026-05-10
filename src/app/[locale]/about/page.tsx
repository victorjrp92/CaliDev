import { getTranslations } from 'next-intl/server';
import { AboutPage } from '@/components/about-page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('headline'),
    description: t('subheadline'),
  };
}

export default async function AboutRoute() {
  return (
    <main>
      <AboutPage />
    </main>
  );
}
