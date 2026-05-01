"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowDown, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SilkBackground } from "@/components/ui/silk-background";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { InstagramIcon, LinkedInIcon, GitHubIcon } from "@/components/social-icons";

const socialLinks = [
  { label: "LinkedIn", handle: "victorjrp9", href: "https://www.linkedin.com/in/victorjrp9/", icon: LinkedInIcon },
  { label: "Instagram", handle: "@calidevdev", href: "https://instagram.com/calidevdev", icon: InstagramIcon },
  { label: "GitHub", handle: "victorjrp92", href: "https://github.com/victorjrp92", icon: GitHubIcon },
];

export function Hero() {
  const t = useTranslations("hero");
  const tp = useTranslations("portfolio");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const highlights = [
    { title: tp("highlight1_title"), desc: tp("highlight1_desc") },
    { title: tp("highlight2_title"), desc: tp("highlight2_desc") },
    { title: tp("highlight3_title"), desc: tp("highlight3_desc") },
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
                Business Efficiency
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 1, ease: "easeOut" }}
                className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-white md:text-xl"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                {t("headline")}
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
                  {t("cta_services")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 cursor-pointer rounded-full border-2 border-white/60 bg-white/10 px-8 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white"
                  render={<a href="https://cal.eu/victor-javier-ramos-perea-ntxfvj/30min" target="_blank" rel="noopener noreferrer" />}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("cta_schedule")}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ duration: 1, delay: 1.4 }}
                className="mt-4 text-xs tracking-[0.2em] uppercase text-white/50"
              >
                {t("subtitle")}
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
                    {tp("badge")}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {tp("title")}, {tp("role")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    {tp("description")}
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
                  render={<Link href="/services" />}
                >
                  {tp("cta")}
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right column — Profile card */}
              <div className="flex flex-col items-center justify-between rounded-2xl border border-border/40 bg-background/60 p-5 text-center md:p-6">
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border border-border/40 shadow-lg md:h-28 md:w-28"
                  >
                    <Image
                      src="/profile.png"
                      alt="Victor Ramos"
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </motion.div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    {tp("profile_name")}
                  </h3>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/45 md:text-[11px]">
                    {tp("profile_subtitle")}
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
                    {tp("profile_bio")}
                  </p>
                </div>

                <div className="mt-4 flex w-full flex-col gap-2">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -2, scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/70 px-3 py-2.5 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 text-foreground/80 transition-colors group-hover:border-primary/30 group-hover:text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {social.label}
                            </p>
                            <p className="text-[11px] text-foreground/60">
                              {social.handle}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
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
