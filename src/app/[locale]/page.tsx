import { Hero } from '@/components/hero';
import { ServicesSection } from '@/components/services-section';
import { BlogSection } from '@/components/blog-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { CtaSection } from '@/components/cta-section';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ServicesSection />
      <BlogSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
