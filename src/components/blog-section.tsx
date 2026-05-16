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

interface BlogSectionPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  image?: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogSection({ posts }: { posts?: BlogSectionPost[] }) {
  const t = useTranslations("blog");

  const displayPosts = (posts || []).slice(0, 3);

  if (displayPosts.length === 0) return null;

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
          {displayPosts.map((post) => (
            <motion.article
              key={post.slug}
              variants={cardVariants}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg"
            >
              <Link href={`/blog/${post.slug}`} className="cursor-pointer block">
                {post.image ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                )}

                <div className="p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold leading-snug transition-colors duration-200 group-hover:text-primary">
                    {post.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {post.description}
                  </p>

                  <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-3 group-hover:gap-2 transition-all duration-200">
                    {t("read_more")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
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
