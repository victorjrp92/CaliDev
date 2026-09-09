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

/**
 * Artículos de un idioma, y solo de ese idioma.
 *
 * El filtro faltaba: `getPostBySlug` recibía el idioma y lo usaba únicamente
 * como valor por defecto, sin descartar nada, así que las tres listas devolvían
 * los cinco artículos. Un lector alemán veía cuatro textos en inglés y uno en
 * español presentados como si fueran suyos, que es peor que no tener ninguno:
 * lo segundo se entiende, lo primero parece un descuido.
 */
export function getAllPosts(locale: string = 'en'): BlogPost[] {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

  const posts = files
    .map(filename => getPostBySlug(filename.replace('.mdx', ''), locale))
    .filter((post): post is BlogPost => post !== null && post.locale === locale)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Un artículo por su slug.
 *
 * A propósito NO filtra por idioma: quien llega a la URL de un artículo por un
 * enlace o por un buscador debe poder leerlo aunque su interfaz esté en otro
 * idioma. Filtrar aquí devolvería un 404 a alguien que tiene el texto delante.
 * Quien filtra es `getAllPosts`, que es donde se decide qué se ofrece.
 */
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

/**
 * Artículos relacionados: primero los de la misma categoría, después los más
 * recientes del mismo idioma.
 *
 * Van al final de cada artículo en vez de una llamada a agendar. El blog está
 * para dar algo gratis y para que los buscadores encuentren el sitio; enlazar
 * el propio contenido sirve a las dos cosas, y una llamada a vender no sirve a
 * ninguna.
 */
export function getRelatedPosts(post: BlogPost, limite = 3): BlogPost[] {
  const resto = getAllPosts(post.locale).filter(p => p.slug !== post.slug);
  const mismaCategoria = resto.filter(p => p.category === post.category);
  const demas = resto.filter(p => p.category !== post.category);
  return [...mismaCategoria, ...demas].slice(0, limite);
}
