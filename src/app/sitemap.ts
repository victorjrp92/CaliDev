import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://victorramosbe.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'es', 'de'];
  const staticPages = ['', '/services', '/blog', '/contact'];

  const staticEntries = locales.flatMap(locale =>
    staticPages.map(page => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  );

  const posts = getAllPosts();
  const blogEntries = locales.flatMap(locale =>
    posts.map(post => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...blogEntries];
}
