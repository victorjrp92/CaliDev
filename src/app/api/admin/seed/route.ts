import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@calidev.dev";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const hash = await hashPassword(adminPassword);

  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${adminEmail}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;

  // Seed hero content
  const heroData = [
    {
      locale: "en",
      headline: "We transform your business with technology that works",
      subtitle: "Efficiency and digital transformation for companies that want to scale",
      cta_services: "View Services",
      cta_schedule: "Schedule a Call",
    },
    {
      locale: "es",
      headline: "Transformamos tu negocio con tecnología que funciona",
      subtitle: "Eficiencia y transformación digital para empresas que quieren escalar",
      cta_services: "Ver Servicios",
      cta_schedule: "Agendar una Llamada",
    },
    {
      locale: "de",
      headline: "Wir transformieren Ihr Unternehmen mit Technologie, die funktioniert",
      subtitle: "Effizienz und digitale Transformation für Unternehmen, die skalieren wollen",
      cta_services: "Dienstleistungen ansehen",
      cta_schedule: "Gespräch vereinbaren",
    },
  ];

  for (const h of heroData) {
    await sql`
      INSERT INTO hero_content (locale, headline, subtitle, cta_services, cta_schedule)
      VALUES (${h.locale}, ${h.headline}, ${h.subtitle}, ${h.cta_services}, ${h.cta_schedule})
      ON CONFLICT (locale) DO UPDATE SET
        headline = ${h.headline},
        subtitle = ${h.subtitle},
        cta_services = ${h.cta_services},
        cta_schedule = ${h.cta_schedule},
        updated_at = NOW()
    `;
  }

  // Seed portfolio content
  const portfolioData = [
    {
      locale: "en",
      badge: "Business Efficiency",
      title: "Victor Ramos",
      role: "CEO & Digital Strategist",
      description: "With years of experience leading digital transformation, product development, and business consulting, I help companies leverage technology to scale efficiently and achieve measurable results.",
      profile_name: "Victor Ramos",
      profile_subtitle: "CEO · Digital Strategist · Business Efficiency",
      profile_bio: "Helping businesses become more efficient through technology and strategy.",
      cta: "View Services",
      highlight1_title: "Expertise",
      highlight1_desc: "Apps, websites, automations, and consulting for companies that want to scale with technology.",
      highlight2_title: "Approach",
      highlight2_desc: "Custom solutions focused on efficiency, ROI, and measurable results.",
      highlight3_title: "Availability",
      highlight3_desc: "Available for projects and advisory. Remote, EU & US time zones.",
    },
    {
      locale: "es",
      badge: "Eficiencia Empresarial",
      title: "Victor Ramos",
      role: "CEO y Estratega Digital",
      description: "Con años de experiencia liderando transformación digital, desarrollo de productos y consultoría empresarial, ayudo a las empresas a aprovechar la tecnología para escalar eficientemente y lograr resultados medibles.",
      profile_name: "Victor Ramos",
      profile_subtitle: "CEO · Estratega Digital · Eficiencia Empresarial",
      profile_bio: "Ayudando a las empresas a ser más eficientes a través de la tecnología y la estrategia.",
      cta: "Ver Servicios",
      highlight1_title: "Experiencia",
      highlight1_desc: "Apps, sitios web, automatizaciones y consultoría para empresas que quieren escalar con tecnología.",
      highlight2_title: "Enfoque",
      highlight2_desc: "Soluciones personalizadas enfocadas en eficiencia, ROI y resultados medibles.",
      highlight3_title: "Disponibilidad",
      highlight3_desc: "Disponible para proyectos y asesoría. Remoto, zonas horarias de UE y EE.UU.",
    },
    {
      locale: "de",
      badge: "Unternehmenseffizienz",
      title: "Victor Ramos",
      role: "CEO & Digitalstratege",
      description: "Mit jahrelanger Erfahrung in der Leitung digitaler Transformation, Produktentwicklung und Unternehmensberatung helfe ich Unternehmen, Technologie zu nutzen, um effizient zu skalieren und messbare Ergebnisse zu erzielen.",
      profile_name: "Victor Ramos",
      profile_subtitle: "CEO · Digitalstratege · Unternehmenseffizienz",
      profile_bio: "Ich helfe Unternehmen, durch Technologie und Strategie effizienter zu werden.",
      cta: "Dienstleistungen ansehen",
      highlight1_title: "Expertise",
      highlight1_desc: "Apps, Websites, Automatisierungen und Beratung für Unternehmen, die mit Technologie skalieren wollen.",
      highlight2_title: "Ansatz",
      highlight2_desc: "Maßgeschneiderte Lösungen mit Fokus auf Effizienz, ROI und messbare Ergebnisse.",
      highlight3_title: "Verfügbarkeit",
      highlight3_desc: "Verfügbar für Projekte und Beratung. Remote, EU- und US-Zeitzonen.",
    },
  ];

  for (const p of portfolioData) {
    await sql`
      INSERT INTO portfolio_content (locale, badge, title, role, description, profile_name, profile_subtitle, profile_bio, cta, highlight1_title, highlight1_desc, highlight2_title, highlight2_desc, highlight3_title, highlight3_desc)
      VALUES (${p.locale}, ${p.badge}, ${p.title}, ${p.role}, ${p.description}, ${p.profile_name}, ${p.profile_subtitle}, ${p.profile_bio}, ${p.cta}, ${p.highlight1_title}, ${p.highlight1_desc}, ${p.highlight2_title}, ${p.highlight2_desc}, ${p.highlight3_title}, ${p.highlight3_desc})
      ON CONFLICT (locale) DO UPDATE SET
        badge = ${p.badge}, title = ${p.title}, role = ${p.role}, description = ${p.description},
        profile_name = ${p.profile_name}, profile_subtitle = ${p.profile_subtitle}, profile_bio = ${p.profile_bio},
        cta = ${p.cta},
        highlight1_title = ${p.highlight1_title}, highlight1_desc = ${p.highlight1_desc},
        highlight2_title = ${p.highlight2_title}, highlight2_desc = ${p.highlight2_desc},
        highlight3_title = ${p.highlight3_title}, highlight3_desc = ${p.highlight3_desc},
        updated_at = NOW()
    `;
  }

  // Seed social links
  await sql`DELETE FROM social_links`;
  const socials = [
    { label: "LinkedIn", handle: "victorjrp9", href: "https://www.linkedin.com/in/victorjrp9/", icon: "linkedin", sort_order: 0 },
    { label: "Instagram", handle: "@calidevdev", href: "https://instagram.com/calidevdev", icon: "instagram", sort_order: 1 },
    { label: "GitHub", handle: "victorjrp92", href: "https://github.com/victorjrp92", icon: "github", sort_order: 2 },
  ];
  for (const s of socials) {
    await sql`
      INSERT INTO social_links (label, handle, href, icon, sort_order)
      VALUES (${s.label}, ${s.handle}, ${s.href}, ${s.icon}, ${s.sort_order})
    `;
  }

  // Seed services
  await sql`DELETE FROM services_i18n`;
  await sql`DELETE FROM services`;

  const servicesSeed = [
    { slug: "mobile", icon: "Smartphone" },
    { slug: "web", icon: "Globe" },
    { slug: "automation", icon: "Zap" },
    { slug: "analytics", icon: "BarChart3" },
  ];

  const servicesI18n: Record<string, Record<string, { title: string; description: string }>> = {
    mobile: {
      en: { title: "App Development", description: "Custom mobile and web applications built with modern tech stacks for maximum performance and user experience." },
      es: { title: "Desarrollo de Apps", description: "Aplicaciones móviles y web personalizadas construidas con tecnologías modernas para máximo rendimiento y experiencia de usuario." },
      de: { title: "App-Entwicklung", description: "Maßgeschneiderte mobile und Web-Anwendungen, entwickelt mit modernen Technologien für maximale Leistung und Benutzererfahrung." },
    },
    web: {
      en: { title: "Websites", description: "Professional, fast, and SEO-optimized websites that convert visitors into customers." },
      es: { title: "Sitios Web", description: "Sitios web profesionales, rápidos y optimizados para SEO que convierten visitantes en clientes." },
      de: { title: "Websites", description: "Professionelle, schnelle und SEO-optimierte Websites, die Besucher in Kunden verwandeln." },
    },
    automation: {
      en: { title: "Automations", description: "Streamline your workflows with intelligent automations that save time and reduce errors." },
      es: { title: "Automatizaciones", description: "Optimiza tus flujos de trabajo con automatizaciones inteligentes que ahorran tiempo y reducen errores." },
      de: { title: "Automatisierungen", description: "Optimieren Sie Ihre Arbeitsabläufe mit intelligenten Automatisierungen, die Zeit sparen und Fehler reduzieren." },
    },
    analytics: {
      en: { title: "Digital Consulting", description: "Strategic guidance on digital transformation, process optimization, and technology adoption." },
      es: { title: "Consultoría Digital", description: "Orientación estratégica en transformación digital, optimización de procesos y adopción de tecnología." },
      de: { title: "Digitale Beratung", description: "Strategische Beratung zu digitaler Transformation, Prozessoptimierung und Technologieeinführung." },
    },
  };

  for (let i = 0; i < servicesSeed.length; i++) {
    const s = servicesSeed[i];
    const result = await sql`
      INSERT INTO services (slug, icon, sort_order) VALUES (${s.slug}, ${s.icon}, ${i})
      RETURNING id
    `;
    const serviceId = result.rows[0].id;
    for (const locale of ["en", "es", "de"]) {
      const t = servicesI18n[s.slug][locale];
      await sql`
        INSERT INTO services_i18n (service_id, locale, title, description)
        VALUES (${serviceId}, ${locale}, ${t.title}, ${t.description})
      `;
    }
  }

  // Seed testimonials
  await sql`DELETE FROM testimonials_i18n`;
  await sql`DELETE FROM testimonials`;

  const testimonialsSeed = [
    { author: "Maria Garcia", role: "TechStart Solutions", rating: 5 },
    { author: "Thomas Mueller", role: "Innovate GmbH", rating: 5 },
    { author: "Laura Martinez", role: "Global Commerce Co", rating: 5 },
  ];

  const testimonialsI18n: Record<number, Record<string, string>> = {
    0: {
      en: "Victor transformed our entire digital infrastructure. The custom app he built reduced our operational costs by 40%.",
      es: "Victor transformó toda nuestra infraestructura digital. La app personalizada que construyó redujo nuestros costos operativos en un 40%.",
      de: "Victor hat unsere gesamte digitale Infrastruktur transformiert. Die maßgeschneiderte App, die er entwickelt hat, reduzierte unsere Betriebskosten um 40%.",
    },
    1: {
      en: "The automation solutions implemented by Victor Ramos BE saved us 20 hours per week. Exceptional ROI.",
      es: "Las soluciones de automatización implementadas por Victor Ramos BE nos ahorraron 20 horas por semana. ROI excepcional.",
      de: "Die von Victor Ramos BE implementierten Automatisierungslösungen sparten uns 20 Stunden pro Woche. Außergewöhnlicher ROI.",
    },
    2: {
      en: "Professional, strategic, and results-driven. Our e-commerce platform saw a 65% increase in conversions.",
      es: "Profesional, estratégico y orientado a resultados. Nuestra plataforma de e-commerce vio un aumento del 65% en conversiones.",
      de: "Professionell, strategisch und ergebnisorientiert. Unsere E-Commerce-Plattform verzeichnete einen Anstieg der Conversions um 65%.",
    },
  };

  for (let i = 0; i < testimonialsSeed.length; i++) {
    const t = testimonialsSeed[i];
    const result = await sql`
      INSERT INTO testimonials (author, role, rating, sort_order)
      VALUES (${t.author}, ${t.role}, ${t.rating}, ${i})
      RETURNING id
    `;
    const tid = result.rows[0].id;
    for (const locale of ["en", "es", "de"]) {
      await sql`
        INSERT INTO testimonials_i18n (testimonial_id, locale, quote)
        VALUES (${tid}, ${locale}, ${testimonialsI18n[i][locale]})
      `;
    }
  }

  return NextResponse.json({ success: true, message: "Database seeded successfully" });
}
