"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Calendar } from "lucide-react";
import type { DbService } from "@/lib/content";

interface AccordionItemProps {
  title: string;
  imageUrl: string;
  isActive: boolean;
  onMouseEnter: () => void;
}

function AccordionItem({
  title,
  imageUrl,
  isActive,
  onMouseEnter,
}: AccordionItemProps) {
  return (
    <div
      className={`
        relative h-[400px] md:h-[450px] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-in-out
        ${isActive ? "w-[300px] md:w-[400px]" : "w-[50px] md:w-[60px]"}
      `}
      onMouseEnter={onMouseEnter}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
        sizes={isActive ? "400px" : "60px"}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <span
        className={`
          absolute text-white text-base md:text-lg font-semibold whitespace-nowrap
          transition-all duration-500 ease-in-out drop-shadow-lg
          ${
            isActive
              ? "bottom-6 left-1/2 -translate-x-1/2 rotate-0 opacity-100"
              : "bottom-24 left-1/2 -translate-x-1/2 rotate-90 opacity-80"
          }
        `}
      >
        {title}
      </span>
    </div>
  );
}

const defaultImages = [
  "https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=600&auto=format&fit=crop",
];

interface ServicesAccordionProps {
  dbServices?: DbService[] | null;
}

export function ServicesAccordion({ dbServices }: ServicesAccordionProps) {
  const t = useTranslations("services");
  const [activeIndex, setActiveIndex] = useState(0);

  const useDb = dbServices && dbServices.length > 0;

  const items = useDb
    ? dbServices.map((svc, i) => ({
        title: svc.title,
        imageUrl: svc.image_url || defaultImages[i % defaultImages.length],
      }))
    : [
        { title: t("app_title"), imageUrl: defaultImages[0] },
        { title: t("web_title"), imageUrl: defaultImages[1] },
        { title: t("auto_title"), imageUrl: defaultImages[2] },
        { title: t("consulting_title"), imageUrl: defaultImages[3] },
      ];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <motion.div
            className="w-full lg:w-1/2 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {t("title")}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-12 cursor-pointer rounded-full px-8 text-sm font-semibold uppercase tracking-widest shadow-lg transition-all duration-200 hover:shadow-xl"
                render={<Link href="/services" />}
              >
                {t("learn_more")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 cursor-pointer rounded-full px-8 text-sm font-semibold uppercase tracking-widest"
                render={
                  <a
                    href="https://cal.eu/victor-javier-ramos-perea-ntxfvj/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                {t("cta_schedule") ?? "Schedule a Call"}
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-row items-center justify-center gap-3 md:gap-4 overflow-x-auto p-2">
              {items.map((item, index) => (
                <AccordionItem
                  key={index}
                  title={item.title}
                  imageUrl={item.imageUrl}
                  isActive={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
