import { sql } from "@vercel/postgres";

export interface DbTestimonial {
  author: string;
  role: string;
  quote: string;
  avatar_url?: string | null;
  rating?: number;
}

export async function getHeroContent(locale: string) {
  try {
    const result = await sql`SELECT * FROM hero_content WHERE locale = ${locale}`;
    if (result.rows.length > 0) return result.rows[0];
  } catch {
    // DB not available, fall through to null
  }
  return null;
}

export async function getPortfolioContent(locale: string) {
  try {
    const result = await sql`SELECT * FROM portfolio_content WHERE locale = ${locale}`;
    if (result.rows.length > 0) return result.rows[0];
  } catch {
    // DB not available
  }
  return null;
}

export async function getSocialLinks() {
  try {
    const result = await sql`SELECT * FROM social_links ORDER BY sort_order`;
    if (result.rows.length > 0) return result.rows;
  } catch {
    // DB not available
  }
  return null;
}

export async function getServices(locale: string) {
  try {
    const result = await sql`
      SELECT s.slug, s.icon, si.title, si.description
      FROM services s
      JOIN services_i18n si ON s.id = si.service_id AND si.locale = ${locale}
      ORDER BY s.sort_order
    `;
    if (result.rows.length > 0) return result.rows;
  } catch {
    // DB not available
  }
  return null;
}

export async function getTestimonials(locale: string): Promise<DbTestimonial[] | null> {
  try {
    const result = await sql`
      SELECT t.author, t.role, t.rating, t.avatar_url, ti.quote
      FROM testimonials t
      JOIN testimonials_i18n ti ON t.id = ti.testimonial_id AND ti.locale = ${locale}
      ORDER BY t.sort_order
    `;
    if (result.rows.length > 0) return result.rows as DbTestimonial[];
  } catch {
    // DB not available
  }
  return null;
}
