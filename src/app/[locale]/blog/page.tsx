import { getAllPosts, getAllCategories } from '@/lib/blog';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog-list';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  const categories = getAllCategories(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  return (
    <main className="container mx-auto px-4 py-24 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </div>
      <BlogList posts={posts} categories={categories} />
    </main>
  );
}
