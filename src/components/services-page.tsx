"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Phone,
  FileSearch,
  Code2,
  Rocket,
  BarChart3,
  Zap,
  Globe,
  Check,
  Calendar,
  ArrowRight,
  Quote,
  Monitor,
  Pencil,
  Languages,
  Search,
  Gauge,
  Shield,
} from "lucide-react";

const calLink = "https://cal.eu/victor-javier-ramos-perea-ntxfvj/30min";

function SectionFade({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function ServicesPage() {
  const t = useTranslations("sp");

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="pt-28 pb-16 px-4 text-center max-w-4xl mx-auto">
        <SectionFade>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            {t("headline")}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("subheadline")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="h-12 cursor-pointer rounded-full px-8" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
              <Calendar className="mr-2 h-4 w-4" />
              {t("hero_cta")}
            </Button>
            <Button size="lg" variant="outline" className="h-12 cursor-pointer rounded-full px-8" render={<a href="#services" />}>
              {t("hero_cta2")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </SectionFade>
      </section>

      {/* ─── Star Product ─── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <SectionFade className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Monitor className="h-4 w-4" />
                {t("star_badge")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">{t("star_title")}</h2>
              <p className="text-muted-foreground text-lg">{t("star_desc")}</p>
              <ul className="space-y-3">
                {[
                  { icon: Pencil, key: "star_f1" },
                  { icon: Languages, key: "star_f2" },
                  { icon: Search, key: "star_f3" },
                  { icon: Gauge, key: "star_f4" },
                  { icon: Shield, key: "star_f5" },
                ].map(({ icon: Icon, key }) => (
                  <li key={key} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <span className="text-2xl font-bold">{t("star_price")}</span>
                <Button size="lg" className="h-12 cursor-pointer rounded-full px-8" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
                  {t("star_cta")}
                </Button>
              </div>
            </SectionFade>
            <SectionFade className="flex-1 w-full" delay={0.2}>
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">calidev.dev/admin</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Pencil className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t("star_demo_title")}</p>
                      <p className="text-xs text-muted-foreground">{t("star_demo_sub")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Title</p>
                      <div className="h-8 rounded bg-muted/50 flex items-center px-3 text-sm">{t("star_demo_field1")}</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <div className="h-16 rounded bg-muted/50 flex items-start px-3 pt-2 text-sm text-muted-foreground">{t("star_demo_field2")}</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-lg border border-border p-3 flex-1">
                        <p className="text-xs text-muted-foreground mb-1">🇬🇧 EN</p>
                        <div className="h-6 rounded bg-primary/10" />
                      </div>
                      <div className="rounded-lg border border-border p-3 flex-1">
                        <p className="text-xs text-muted-foreground mb-1">🇪🇸 ES</p>
                        <div className="h-6 rounded bg-muted/50" />
                      </div>
                      <div className="rounded-lg border border-border p-3 flex-1">
                        <p className="text-xs text-muted-foreground mb-1">🇩🇪 DE</p>
                        <div className="h-6 rounded bg-muted/50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <div className="rounded-full bg-primary px-6 py-2 text-primary-foreground text-sm font-medium">
                      {t("star_demo_btn")}
                    </div>
                  </div>
                </div>
              </div>
            </SectionFade>
          </div>
        </div>
      </section>

      {/* ─── How We Work ─── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{t("process_title")}</h2>
          </SectionFade>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Phone, key: "step1", num: "01" },
              { icon: FileSearch, key: "step2", num: "02" },
              { icon: Code2, key: "step3", num: "03" },
              { icon: Rocket, key: "step4", num: "04" },
            ].map(({ icon: Icon, key, num }, i) => (
              <SectionFade key={key} delay={i * 0.1}>
                <div className="text-center space-y-4">
                  <span className="text-5xl font-bold text-primary/15">{num}</span>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{t(`${key}_title`)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`${key}_desc`)}</p>
                </div>
              </SectionFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-6xl mx-auto space-y-24">
          {[
            { icon: BarChart3, key: "consulting", testimonial: "cubiko" },
            { icon: Zap, key: "auto", testimonial: "limpia_short" },
            { icon: Globe, key: "apps", testimonial: null },
          ].map(({ icon: Icon, key, testimonial }, i) => (
            <SectionFade key={key}>
              <div id={key} className={`scroll-mt-24 flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 items-center`}>
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold">{t(`svc_${key}_title`)}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{t(`svc_${key}_desc`)}</p>
                  <ul className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <li key={n} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{t(`svc_${key}_b${n}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="cursor-pointer rounded-full px-6" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
                    {t("svc_cta")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 w-full">
                  {testimonial ? (
                    <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
                      <Quote className="h-8 w-8 text-primary/30" />
                      <p className="text-foreground italic leading-relaxed">{t(`t_${testimonial}_text`)}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {t(`t_${testimonial}_name`).charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t(`t_${testimonial}_name`)}</p>
                          <p className="text-xs text-muted-foreground">{t(`t_${testimonial}_role`)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-12 flex flex-col items-center justify-center text-center space-y-4 aspect-square max-h-[400px]">
                      <Icon className="h-16 w-16 text-primary/20" />
                      <p className="text-muted-foreground text-sm max-w-xs">{t(`svc_${key}_visual`)}</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionFade>
          ))}
        </div>
      </section>

      {/* ─── Results ─── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("results_title")}</h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">{t("results_sub")}</p>
          </SectionFade>

          {/* LimpiaExpress */}
          <SectionFade>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-12 mb-12">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">D</div>
                    <div>
                      <p className="font-bold">{t("t_limpia_name")}</p>
                      <p className="text-sm text-muted-foreground">{t("t_limpia_role")}</p>
                    </div>
                  </div>
                  <Quote className="h-6 w-6 text-primary/30" />
                  <p className="text-foreground italic leading-relaxed text-lg">{t("t_limpia_text")}</p>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    {["s1", "s2", "s3", "s4"].map((s) => (
                      <div key={s} className="rounded-xl bg-muted/50 p-6 text-center">
                        <p className="text-2xl md:text-3xl font-bold text-primary">{t(`t_limpia_${s}_val`)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t(`t_limpia_${s}_label`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionFade>

          {/* Cubiko */}
          <SectionFade>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex items-center gap-3 md:w-1/4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">L</div>
                  <div>
                    <p className="font-bold">{t("t_cubiko_name")}</p>
                    <p className="text-sm text-muted-foreground">{t("t_cubiko_role")}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <Quote className="h-5 w-5 text-primary/30 mb-2" />
                  <p className="text-foreground italic leading-relaxed">{t("t_cubiko_text")}</p>
                </div>
              </div>
            </div>
          </SectionFade>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("pricing_title")}</h2>
            <p className="text-muted-foreground text-lg mb-8">{t("pricing_desc")}</p>
            <div className="inline-flex items-baseline gap-2 mb-8">
              <span className="text-muted-foreground text-lg">{t("pricing_from")}</span>
              <span className="text-5xl font-bold text-primary">€600</span>
            </div>
            <div>
              <Button size="lg" className="h-14 cursor-pointer rounded-full px-10 text-base" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
                <Calendar className="mr-2 h-5 w-5" />
                {t("pricing_cta")}
              </Button>
            </div>
          </SectionFade>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("final_title")}</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t("final_desc")}</p>
            <Button size="lg" className="h-14 cursor-pointer rounded-full px-10 text-base" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
              <Calendar className="mr-2 h-5 w-5" />
              {t("final_cta")}
            </Button>
          </SectionFade>
        </div>
      </section>
    </div>
  );
}
