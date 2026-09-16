import { getPostBySlug, getAllPosts, getRelatedPosts } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ShareButtons } from '@/components/share-buttons';
import { Panel } from '@/components/senal/panel';
import { Link } from '@/i18n/routing';
import { alternatesDe, urlCanonica } from '@/lib/canonica';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

/**
 * El canonical apunta al idioma del ARTÍCULO, no al de la URL, y aquí NO se
 * emite grupo hreflang.
 *
 * Es el único sitio del sitio donde no vale el canonical autorreferente: hay un
 * solo archivo MDX por slug y `getPostBySlug` lo sirve bajo los tres idiomas a
 * propósito, para que quien llegue de un enlace pueda leerlo. Eso significa que
 * `/en/blog/x`, `/es/blog/x` y `/de/blog/x` devuelven exactamente el mismo
 * texto: tres canonical autorreferentes le dirían a un buscador que indexe tres
 * copias del mismo artículo. Apuntando los tres al idioma real del post, las
 * tres URLs siguen abriéndose para quien las visita y solo se indexa una.
 *
 * Y por eso mismo `idiomas: false`. Un grupo hreflang dice «esto es el mismo
 * contenido traducido, sirve a cada quien el suyo», y aquí no hay traducción
 * ninguna: hay un texto servido tres veces. Declararlo sería falso, y además se
 * daría de bruces con el canonical de arriba —Google exige que cada miembro de
 * un grupo hreflang sea autocanónico, y dos de los tres no lo son—, lo que tira
 * el grupo entero. Las otras cuatro familias de rutas (home, about, blog,
 * contact) sí están traducidas de verdad y sí lo declaran.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return { title: 'Post Not Found' };
  const ruta = `/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: alternatesDe(post.locale, ruta, { idiomas: false }),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: urlCanonica(post.locale, ruta),
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

  const relacionados = getRelatedPosts(post);

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

      {relacionados.length > 0 && (
        <Panel fondo="niebla">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {t('related')}
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {relacionados.map((r) => (
              <li key={r.slug} className="border-t border-[var(--linea-tinta)] pt-6">
                <p className="mono text-[var(--verde)]">
                  {r.category} · {r.readingTime}
                </p>
                <h3 className="mt-4 text-[1.2rem] font-semibold leading-[1.25] tracking-[-0.02em]">
                  <Link href={`/blog/${r.slug}`} className="titulo-articulo">
                    {r.title}
                  </Link>
                </h3>
                <p className="mt-3 leading-[1.6] opacity-70">{r.description}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </main>
  );
}
