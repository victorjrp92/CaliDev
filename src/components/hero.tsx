"use client";

import { motion } from "motion/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowDown, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SilkBackground } from "@/components/ui/silk-background";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { InstagramIcon, LinkedInIcon, GitHubIcon, XIcon } from "@/components/social-icons";

const defaultSocialLinks = [
  { label: "LinkedIn", handle: "victorjrp9", href: "https://www.linkedin.com/in/victorjrp9/", icon: "linkedin" },
  { label: "Instagram", handle: "@calidevdev", href: "https://instagram.com/calidevdev", icon: "instagram" },
  { label: "GitHub", handle: "victorjrp92", href: "https://github.com/victorjrp92", icon: "github" },
];

const iconMap: Record<string, typeof LinkedInIcon> = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  github: GitHubIcon,
  x: XIcon,
};

interface HeroProps {
  dbHero?: Record<string, unknown> | null;
  dbPortfolio?: Record<string, unknown> | null;
  dbSocialLinks?: Record<string, unknown>[] | null;
}

export function Hero({ dbHero, dbPortfolio, dbSocialLinks }: HeroProps) {
  const t = useTranslations("hero");
  const tp = useTranslations("portfolio");

  const h = (key: string) => (dbHero?.[key] as string) || t(key);
  const p = (key: string) => tp(key);

  const socialLinks = (dbSocialLinks || defaultSocialLinks).map((s) => ({
    label: s.label as string,
    handle: s.handle as string,
    href: s.href as string,
    icon: iconMap[(s.icon as string) || "linkedin"] || LinkedInIcon,
  }));

  const photoUrl = (dbHero?.photo_url as string) || "/profile.png";
  const photoPosition = (dbHero?.photo_position as string) || "center 15%";
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const richOpts = {
    h: (chunks: React.ReactNode) => <span className="font-semibold text-primary">{chunks}</span>,
  };

  const highlights = [
    { title: p("highlight1_title"), desc: tp.rich("highlight1_desc", richOpts) },
    { title: p("highlight2_title"), desc: tp.rich("highlight2_desc", richOpts) },
    { title: p("highlight3_title"), desc: tp.rich("highlight3_desc", richOpts) },
  ];

  return (
    <div className="relative bg-[#0A3C30]" style={{ clipPath: "inset(0)" }}>
      {/* Fixed silk background, clipped to this container */}
      <div className="fixed inset-0">
        <SilkBackground />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0A3C30]/40 via-[#0A3C30]/20 to-[#0A3C30]/60" />
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ArrowDown className="h-5 w-5 text-white/60" />
      </motion.div>

      {/* ContainerScroll with hero title + portfolio in iPad */}
      <div className="relative z-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center">
              <AnimatedHeroTitle />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                className="mt-2 text-base font-light tracking-[0.25em] uppercase text-white/70 md:text-lg"
              >
                {p("badge")}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 1, ease: "easeOut" }}
                className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-white md:text-xl"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                {h("headline")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                className="mt-8 flex flex-wrap justify-center gap-4"
              >
                <Button
                  size="lg"
                  className="h-12 cursor-pointer rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-[0.15em] text-[#0A3C30] shadow-lg transition-all duration-200 hover:bg-white/90 hover:shadow-xl"
                  render={<Link href="/services" />}
                >
                  {h("cta_services")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 cursor-pointer rounded-full border-2 border-white/60 bg-white/10 px-8 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white"
                  render={<a href="https://cal.eu/victor-javier-ramos-perea-ntxfvj/30min" target="_blank" rel="noopener noreferrer" />}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {h("cta_schedule")}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ duration: 1, delay: 1.4 }}
                className="mt-4 text-xs tracking-[0.2em] uppercase text-white/50"
              >
                {h("subtitle")}
              </motion.p>
            </div>
          }
        >
          {/* Portfolio content inside the iPad */}
          <div className="h-full w-full overflow-y-auto p-5 md:p-8">
            <div className="grid h-full gap-6 lg:grid-cols-2">
              {/* Left column — Info */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/40">
                    {p("badge")}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {p("title")}
                  </h2>
                  <p className="text-sm font-medium text-primary">
                    {p("role")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    {p("description")}
                  </p>
                </div>

                <div className="space-y-2">
                  {highlights.map((item) => (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -3, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="cursor-default rounded-xl border border-border/40 bg-background/60 p-4 transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/40">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="h-10 w-full cursor-pointer gap-2 rounded-full text-sm uppercase tracking-[0.2em] transition-all hover:shadow-lg sm:w-auto"
                  render={<a href="https://cal.eu/victor-javier-ramos-perea-ntxfvj/30min" target="_blank" rel="noopener noreferrer" />}
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  {p("cta")}
                </Button>
              </div>

              {/* Right column — Profile card */}
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-background/60 p-5 text-center md:p-6">
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border border-border/40 shadow-lg md:h-28 md:w-28"
                  >
                    <Image
                      src={photoUrl}
                      alt="Victor Ramos"
                      fill
                      className="object-cover"
                      style={{ objectPosition: photoPosition }}
                      sizes="112px"
                    />
                  </motion.div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    {p("profile_name")}
                  </h3>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/45 md:text-[11px]">
                    {p("profile_subtitle")}
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
                    {p("profile_bio")}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background/70 text-foreground/60 transition-colors duration-200 hover:border-primary/30 hover:text-primary hover:shadow-md"
                      >
                        <Icon className="h-4 w-4" />
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>
    </div>
  );
}
