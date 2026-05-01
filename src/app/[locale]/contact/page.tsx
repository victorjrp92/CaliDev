import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/contact-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <main className="container mx-auto px-4 py-24 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </div>
      <ContactForm />
    </main>
  );
}
