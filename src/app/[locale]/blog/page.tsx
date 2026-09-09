import { getAllPosts, getAllCategories, getPostsInOtherLanguages } from '@/lib/blog';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog-list';
import { OtrosIdiomas } from '@/components/otros-idiomas';
import { Panel } from '@/components/senal/panel';
import { Titular } from '@/components/senal/titular';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return { title: t('title'), description: t('subtitle') };
}

/**
 * Blog.
 *
 * NO lleva el panel de cierre. Esta sección existe para dar algo gratis y para
 * que los buscadores encuentren el sitio; meterle una llamada a agendar la
 * convierte en un embudo y traiciona el trato: quien viene a leer, lee.
 *
 * Dos listas y no una: primero lo escrito en el idioma de quien mira, después
 * lo demás marcado con su idioma. Antes no había filtro y los cuatro textos en
 * inglés aparecían bajo `/es/` como si fueran españoles, que confunde al lector
 * y a Google por igual; pero filtrar y ya escondía cuatro artículos buenos y
 * dejaba el blog en español pareciendo vacío. Nada se oculta, nada se disfraza.
 */
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  const categories = getAllCategories(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  const otros = getPostsInOtherLanguages(locale);

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
          </div>
        )}
      </Panel>

      {otros.length > 0 && <OtrosIdiomas posts={otros} />}
    </main>
  );
}
