"use client";
import { motion } from "motion/react";
import { Smartphone, Globe, Zap, BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const services = [
  { id: "app-development", icon: Smartphone, key: "app" },
  { id: "websites", icon: Globe, key: "web" },
  { id: "automations", icon: Zap, key: "auto" },
  { id: "consulting", icon: BarChart3, key: "consulting" },
];

export function ServicesContent() {
  const t = useTranslations("services");

  return (
    <div className="space-y-24">
      {services.map((service, i) => (
        <motion.section
          key={service.id}
          id={service.id}
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}>
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <service.icon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">{t(`${service.key}_title`)}</h2>
              <p className="text-muted-foreground text-lg">{t(`${service.key}_desc`)}</p>
              <div>
                <h3 className="font-semibold mb-3">{t("benefits")}</h3>
                <ul className="space-y-2">
                  {[1, 2, 3].map(n => (
                    <li key={n} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {t(`${service.key}_benefit${n}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <Button render={<Link href="/contact" />} className="cursor-pointer">
                {t("learn_more")}
              </Button>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center">
                <service.icon className="h-24 w-24 text-primary/20" />
              </div>
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
