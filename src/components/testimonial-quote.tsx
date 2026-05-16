"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Quote } from "lucide-react";

export function TestimonialQuote() {
  const t = useTranslations("testimonial_quote");

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <Quote className="mx-auto mb-6 h-10 w-10 text-primary/30" />
        <blockquote className="text-xl leading-relaxed text-foreground md:text-2xl">
          &ldquo;{t("quote")}&rdquo;
        </blockquote>
        <div className="mt-6">
          <p className="text-base font-semibold">{t("name")}</p>
          <p className="text-sm text-muted-foreground">{t("role")}</p>
        </div>
      </motion.div>
    </section>
  );
}
