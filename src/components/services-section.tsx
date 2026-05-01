"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  Smartphone,
  Globe,
  Zap,
  BarChart3,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

interface ServiceCardData {
  key: string;
  icon: LucideIcon;
  href: string;
}

const services: ServiceCardData[] = [
  { key: "app", icon: Smartphone, href: "/services#app-development" },
  { key: "web", icon: Globe, href: "/services#websites" },
  { key: "auto", icon: Zap, href: "/services#automations" },
  { key: "consulting", icon: BarChart3, href: "/services#consulting" },
];

export function ServicesSection() {
  const t = useTranslations("services");

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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service) => (
            <motion.div
              key={service.key}
              variants={cardVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {t(`${service.key}_title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`${service.key}_desc`)}
              </p>
              <Button
                variant="link"
                className="mt-4 h-auto cursor-pointer p-0 text-primary transition-colors duration-200"
                render={<Link href={service.href} />}
              >
                {t("learn_more")}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
