import { Hero } from '@/components/hero';
import { ServicesSection } from '@/components/services-section';
import { BlogSection } from '@/components/blog-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { CtaSection } from '@/components/cta-section';
import {
  getHeroContent,
  getPortfolioContent,
  getSocialLinks,
  getServices,
  getTestimonials,
} from '@/lib/content';
import { getLocale } from 'next-intl/server';

export default async function HomePage() {
  const locale = await getLocale();

  const [heroContent, portfolioContent, socialLinks, services, testimonials] = await Promise.all([
    getHeroContent(locale),
    getPortfolioContent(locale),
    getSocialLinks(),
    getServices(locale),
    getTestimonials(locale),
  ]);

  return (
    <main>
      <Hero
        dbHero={heroContent}
        dbPortfolio={portfolioContent}
        dbSocialLinks={socialLinks}
      />
      <ServicesSection dbServices={services} />
      <BlogSection />
      <TestimonialsSection dbTestimonials={testimonials} />
      <CtaSection />
    </main>
  );
}
