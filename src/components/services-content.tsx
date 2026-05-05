"use client";
import { motion } from "motion/react";
import {
  Smartphone,
  Globe,
  Zap,
  BarChart3,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { DbService } from "@/lib/content";

const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Globe,
  Zap,
  BarChart3,
};

const slugToKey: Record<string, string> = {
  mobile: "app",
  web: "web",
  automation: "auto",
  analytics: "consulting",
};

const defaultServices = [
  { id: "app-development", icon: Smartphone, key: "app" },
  { id: "websites", icon: Globe, key: "web" },
  { id: "automations", icon: Zap, key: "auto" },
  { id: "consulting", icon: BarChart3, key: "consulting" },
];

interface ServicesContentProps {
  dbServices?: DbService[] | null;
}

export function ServicesContent({ dbServices }: ServicesContentProps) {
  const t = useTranslations("services");
  const useDb = dbServices && dbServices.length > 0;

  const items = useDb
    ? dbServices.map((svc) => ({
        id: svc.slug,
        icon: iconMap[svc.icon] || BarChart3,
        key: slugToKey[svc.slug] || svc.slug,
        title: svc.title,
        desc: svc.description,
        imageUrl: svc.image_url,
      }))
    : defaultServices.map((s) => ({
        id: s.id,
        icon: s.icon,
        key: s.key,
        title: t(`${s.key}_title`),
        desc: t(`${s.key}_desc`),
        imageUrl: null as string | null,
      }));

  return (
    <div className="space-y-24">
      {items.map((service, i) => (
        <motion.section
          key={service.id}
          id={service.id}
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-16 items-center`}
          >
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <service.icon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">{service.title}</h2>
              <p className="text-muted-foreground text-lg">{service.desc}</p>
              <div>
                <h3 className="font-semibold mb-3">{t("benefits")}</h3>
                <ul className="space-y-2">
                  {[1, 2, 3].map((n) => {
                    const benefitKey = `${service.key}_benefit${n}`;
                    return (
                      <li
                        key={n}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {t(benefitKey)}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Button
                render={<Link href="/contact" />}
                className="cursor-pointer"
              >
                {t("learn_more")}
              </Button>
            </div>
            <div className="flex-1 w-full">
              {service.imageUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center">
                  <service.icon className="h-24 w-24 text-primary/20" />
                </div>
              )}
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
