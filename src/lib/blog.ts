import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const contentDir = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  tags: string[];
  category: string;
  locale: string;
  author: string;
  content: string;
  readingTime: string;
}

export function getAllPosts(locale: string = 'en'): BlogPost[] {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

  const posts = files
    .map(filename => {
      const slug = filename.replace('.mdx', '');
      return getPostBySlug(slug, locale);
    })
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string, locale: string = 'en'): BlogPost | null {
  const filePath = path.join(contentDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
    image: data.image || null,
    tags: data.tags || [],
    category: data.category || 'general',
    locale: data.locale || locale,
    author: data.author || 'Victor Ramos',
    content,
    readingTime: stats.text,
  };
}

export function getAllTags(locale: string = 'en'): string[] {
  const posts = getAllPosts(locale);
  const tags = new Set<string>();
  posts.forEach(p => p.tags.forEach(t => tags.add(t)));
  return Array.from(tags);
}

export function getAllCategories(locale: string = 'en'): string[] {
  const posts = getAllPosts(locale);
  const cats = new Set<string>();
  posts.forEach(p => cats.add(p.category));
  return Array.from(cats);
}
