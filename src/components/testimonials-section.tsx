"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Quote } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
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

const avatarColors = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
];

interface TestimonialData {
  key: string;
  initials: string;
}

const testimonials: TestimonialData[] = [
  { key: "t1", initials: "MG" },
  { key: "t2", initials: "TM" },
  { key: "t3", initials: "LM" },
];

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

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
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.key}
              variants={cardVariants}
              className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md dark:bg-white/5"
            >
              <Quote className="mb-4 h-8 w-8 text-primary/40" />
              <blockquote className="text-base leading-relaxed text-foreground">
                &ldquo;{t(`${testimonial.key}_text`)}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarColors[index % avatarColors.length]}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {t(`${testimonial.key}_name`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`${testimonial.key}_company`)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
