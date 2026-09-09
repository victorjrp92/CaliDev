import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShareButtons } from '@/components/share-buttons';
import { Panel } from '@/components/senal/panel';
import { Cierre } from '@/components/senal/cierre';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  if (!post) notFound();

  const fecha = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main>
      {/* La cabecera va en verde para que el artículo empiece con un respiro
          oscuro y el texto arranque en el papel, como en un libro. */}
      <Panel fondo="verde">
        <p className="mono text-[var(--lima)]">
          {post.category} · {fecha} · {post.readingTime}
        </p>
        <h1 className="mt-6 max-w-[22ch] text-[clamp(2.1rem,5vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
          {post.title}
        </h1>
        <p className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.6] opacity-75">
          {post.description}
        </p>
        <p className="mono mt-8 opacity-55">
          {t('author')}: {post.author}
        </p>
      </Panel>

      <Panel fondo="hueso">
        {/* 68 caracteres de medida: por encima de eso el ojo pierde el salto de
            línea y hay que releer. Los estilos de `.articulo` viven en senal.css
            porque MDX genera las etiquetas y aquí no hay dónde ponerles clase. */}
        <article className="articulo mx-auto max-w-[68ch]">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
              },
            }}
          />
        </article>

        <div className="mx-auto mt-16 max-w-[68ch] border-t border-[var(--linea-tinta)] pt-8">
          <ShareButtons title={post.title} />
        </div>
      </Panel>

      <Cierre />
    </main>
  );
}
