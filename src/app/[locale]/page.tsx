import { Hero } from '@/components/hero';
import { ServicesAccordion } from '@/components/ui/interactive-image-accordion';
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

export const revalidate = 60;

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
      <ServicesAccordion dbServices={services} />
      <BlogSection />
      <TestimonialsSection dbTestimonials={testimonials} />
      <CtaSection />
    </main>
  );
}
