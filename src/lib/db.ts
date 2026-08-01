import { sql } from "@vercel/postgres";

export { sql };

export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS hero_content (
      id SERIAL PRIMARY KEY,
      locale TEXT NOT NULL,
      headline TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      cta_services TEXT NOT NULL,
      cta_schedule TEXT NOT NULL,
      photo_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(locale)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS social_links (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      handle TEXT NOT NULL,
      href TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INT DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      sort_order INT DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS services_i18n (
      id SERIAL PRIMARY KEY,
      service_id INT REFERENCES services(id) ON DELETE CASCADE,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      UNIQUE(service_id, locale)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      author TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_url TEXT,
      rating INT DEFAULT 5,
      sort_order INT DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS testimonials_i18n (
      id SERIAL PRIMARY KEY,
      testimonial_id INT REFERENCES testimonials(id) ON DELETE CASCADE,
      locale TEXT NOT NULL,
      quote TEXT NOT NULL,
      UNIQUE(testimonial_id, locale)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payment_links (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_address TEXT,
      description TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT DEFAULT 'EUR',
      status TEXT DEFAULT 'pending',
      stripe_session_id TEXT,
      receipt_number TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS business_info (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      email TEXT,
      phone TEXT,
      tax_id TEXT,
      tax_note TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      campaign TEXT NOT NULL DEFAULT 'directo',

      -- contacto
      name TEXT NOT NULL,
      company TEXT,
      whatsapp TEXT NOT NULL,
      email TEXT,

      -- respuestas del filtro (claves definidas en lib/leads.ts)
      role TEXT,
      staff TEXT,
      country TEXT,
      country_other TEXT,
      payment_model TEXT,
      payroll_hours TEXT,
      services_month TEXT,
      urgency TEXT,

      -- calculado en el servidor, nunca enviado por el cliente
      score_value INT NOT NULL DEFAULT 0,
      score_intent INT NOT NULL DEFAULT 0,
      score_total INT NOT NULL DEFAULT 0,
      track TEXT NOT NULL DEFAULT 'servicio',
      qualified BOOLEAN NOT NULL DEFAULT FALSE,

      -- gestión
      status TEXT NOT NULL DEFAULT 'nuevo',
      notes TEXT,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      referral_contact TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS leads_score_idx ON leads (score_total DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS leads_campaign_idx ON leads (campaign)`;

  // Add columns that may not exist yet
  await sql`ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS photo_position TEXT DEFAULT '50% 25%'`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT`;
  await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit1 TEXT`;
  await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit2 TEXT`;
  await sql`ALTER TABLE services_i18n ADD COLUMN IF NOT EXISTS benefit3 TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS portfolio_content (
      id SERIAL PRIMARY KEY,
      locale TEXT NOT NULL,
      badge TEXT NOT NULL,
      title TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      profile_name TEXT NOT NULL,
      profile_subtitle TEXT NOT NULL,
      profile_bio TEXT NOT NULL,
      cta TEXT NOT NULL,
      highlight1_title TEXT NOT NULL,
      highlight1_desc TEXT NOT NULL,
      highlight2_title TEXT NOT NULL,
      highlight2_desc TEXT NOT NULL,
      highlight3_title TEXT NOT NULL,
      highlight3_desc TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(locale)
    )
  `;
}
