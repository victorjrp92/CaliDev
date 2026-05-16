import { Hero } from '@/components/hero';
import { ServicesAccordion } from '@/components/ui/interactive-image-accordion';
import { BlogSection } from '@/components/blog-section';
import { ResultsStrip } from '@/components/results-strip';
import { TestimonialQuote } from '@/components/testimonial-quote';
import { CtaSection } from '@/components/cta-section';
import {
  getHeroContent,
  getPortfolioContent,
  getSocialLinks,
} from '@/lib/content';
import { getAllPosts } from '@/lib/blog';
import { getLocale } from 'next-intl/server';

export const revalidate = 60;

export default async function HomePage() {
  const locale = await getLocale();

  const [heroContent, portfolioContent, socialLinks] = await Promise.all([
    getHeroContent(locale),
    getPortfolioContent(locale),
    getSocialLinks(),
  ]);

  const blogPosts = getAllPosts(locale);

  return (
    <main>
      <Hero
        dbHero={heroContent}
        dbPortfolio={portfolioContent}
        dbSocialLinks={socialLinks}
      />
      <ServicesAccordion />
      <ResultsStrip />
      <TestimonialQuote />
      <BlogSection posts={blogPosts} />
      <CtaSection />
    </main>
  );
}
