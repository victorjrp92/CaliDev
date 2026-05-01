"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Calendar } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <motion.div
        className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent px-8 py-16 text-center md:px-16 md:py-24"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 md:text-xl">
          {t("subtitle")}
        </p>
        <motion.div
          className="mt-8"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            size="lg"
            className="h-12 cursor-pointer bg-white px-8 text-base font-semibold text-primary shadow-lg transition-colors duration-200 hover:bg-white/90"
            render={<Link href="/contact" />}
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t("button")}
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
