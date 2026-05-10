import { getTranslations } from 'next-intl/server';
import { ServicesPage } from '@/components/services-page';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sp' });
  return {
    title: t('headline'),
    description: t('subheadline'),
  };
}

export default async function ServicesRoute() {
  return (
    <main>
      <ServicesPage />
    </main>
  );
}
