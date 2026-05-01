"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { BlogPost } from "@/lib/blog";

export function BlogList({ posts, categories }: { posts: BlogPost[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const t = useTranslations("blog");

  const filtered = activeCategory
    ? posts.filter(p => p.category === activeCategory)
    : posts;

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors duration-200 ${
            !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t("filter_all")}
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm capitalize cursor-pointer transition-colors duration-200 ${
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((post, i) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10" />
                <div className="p-5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-200">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-3 group-hover:gap-2 transition-all duration-200">
                    {t("read_more")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
