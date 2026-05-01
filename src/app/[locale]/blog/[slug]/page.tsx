import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { ShareButtons } from '@/components/share-buttons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
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

  return (
    <main className="container mx-auto px-4 py-24 max-w-3xl">
      <article>
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </span>
          </div>
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
              },
            }}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <ShareButtons title={post.title} slug={post.slug} />
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 text-center">
          <h3 className="text-xl font-semibold mb-2">{t("related")}</h3>
          <p className="text-muted-foreground mb-4">Interested in working together?</p>
          <Button render={<Link href="/contact" />} className="cursor-pointer">
            Get in Touch
          </Button>
        </div>
      </article>
    </main>
  );
}
