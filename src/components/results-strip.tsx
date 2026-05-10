"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

const stats = [
  { key: "s1" },
  { key: "s2" },
  { key: "s3" },
  { key: "s4" },
];

export function ResultsStrip() {
  const t = useTranslations("results_strip");

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("title")}</h2>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {stats.map(({ key }) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{t(`${key}_val`)}</p>
              <p className="text-sm text-muted-foreground mt-2">{t(`${key}_label`)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t(`${key}_client`)}</p>
            </div>
          ))}
        </motion.div>

        <div className="text-center">
          <Button variant="outline" className="cursor-pointer rounded-full px-6" render={<Link href="/about" />}>
            {t("cta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
