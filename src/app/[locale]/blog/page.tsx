import { getAllPosts, getAllCategories } from '@/lib/blog';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog-list';
import { Panel } from '@/components/senal/panel';
import { Titular } from '@/components/senal/titular';
import { Boton } from '@/components/senal/boton';
import { Cierre } from '@/components/senal/cierre';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return { title: t('title'), description: t('subtitle') };
}

/**
 * Blog.
 *
 * Hay artículos en inglés y en español, y ninguno en alemán. Sin estado vacío,
 * `/de/blog` devolvía una página en blanco con un titular flotando: parece un
 * sitio roto, no un blog al que aún le faltan traducciones. Ahora lo dice y
 * ofrece el idioma donde sí hay algo que leer.
 */
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  const categories = getAllCategories(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  // Adónde mandar a quien llega a un idioma sin artículos: al que más tenga.
  const refugio = (['en', 'es', 'de'] as const)
    .filter((l) => l !== locale)
    .map((l) => ({ locale: l, n: getAllPosts(l).length }))
    .sort((a, b) => b.n - a.n)[0];

  return (
    <main>
      <Panel fondo="verde">
        <Titular etiqueta="Blog" nivel="h1" entrada={t('subtitle')}>
          {t('title')}
        </Titular>
      </Panel>

      <Panel fondo="hueso">
        {posts.length > 0 ? (
          <BlogList posts={posts} categories={categories} />
        ) : (
          <div className="max-w-[46ch]">
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
              {t('vacio_titulo')}
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] opacity-75">{t('vacio_desc')}</p>
            {refugio && refugio.n > 0 && (
              <Boton forma="verde" href="/blog" locale={refugio.locale} className="mt-9">
                {t('vacio_boton')}
              </Boton>
            )}
          </div>
        )}
      </Panel>

      <Cierre />
    </main>
  );
}
