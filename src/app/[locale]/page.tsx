import { Hero } from '@/components/hero';
import { ServicesAccordion } from '@/components/ui/interactive-image-accordion';
import { BlogSection } from '@/components/blog-section';
import { ResultsStrip } from '@/components/results-strip';
import { CtaSection } from '@/components/cta-section';
import {
  getHeroContent,
  getPortfolioContent,
  getSocialLinks,
  getServices,
} from '@/lib/content';
import { getLocale } from 'next-intl/server';

export const revalidate = 60;

export default async function HomePage() {
  const locale = await getLocale();

  const [heroContent, portfolioContent, socialLinks, services] = await Promise.all([
    getHeroContent(locale),
    getPortfolioContent(locale),
    getSocialLinks(),
    getServices(locale),
  ]);

  return (
    <main>
      <Hero
        dbHero={heroContent}
        dbPortfolio={portfolioContent}
        dbSocialLinks={socialLinks}
      />
      <ServicesAccordion dbServices={services} />
      <ResultsStrip />
      <BlogSection />
      <CtaSection />
    </main>
  );
}
