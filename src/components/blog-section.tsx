"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ArrowRight, CalendarDays } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

interface MockPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  image: string | null;
}

const mockPosts: MockPost[] = [
  {
    slug: "bienvenida",
    title: "Welcome to Victor Ramos BE Blog",
    date: "2026-04-30",
    tags: ["announcement", "digital"],
    excerpt:
      "Discover how we help businesses transform through technology.",
    image: null,
  },
  {
    slug: "5-automation-tools",
    title: "5 Automation Tools Every Business Needs",
    date: "2026-04-25",
    tags: ["automation", "tools"],
    excerpt:
      "Save time and reduce errors with these essential automation solutions.",
    image: null,
  },
  {
    slug: "digital-transformation-guide",
    title: "The Complete Digital Transformation Guide",
    date: "2026-04-20",
    tags: ["consulting", "strategy"],
    excerpt:
      "A step-by-step roadmap for modernizing your business operations.",
    image: null,
  },
];

const gradientColors = [
  "from-primary/60 to-accent/40",
  "from-accent/50 to-primary/30",
  "from-primary/40 to-accent/60",
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogSection() {
  const t = useTranslations("blog");

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {mockPosts.map((post, index) => (
            <motion.article
              key={post.slug}
              variants={cardVariants}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
            >
              {/* Image placeholder */}
              <div
                className={`h-48 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} flex items-center justify-center`}
              >
                <span className="text-4xl font-bold text-white/30 select-none">
                  CaliDev
                </span>
              </div>

              <div className="p-6">
                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold leading-snug transition-colors duration-200 group-hover:text-primary">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="cursor-pointer"
                  >
                    {post.title}
                  </Link>
                </h3>

                {/* Date */}
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </div>

                {/* Excerpt */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            size="lg"
            variant="outline"
            className="cursor-pointer transition-all duration-200"
            render={<Link href="/blog" />}
          >
            {t("view_all")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
