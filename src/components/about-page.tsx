"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Coins,
  HeartHandshake,
  Target,
  Eye,
  Calendar,
  Quote,
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

export function AboutPage() {
  const t = useTranslations("about");

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
        </SectionFade>
      </section>

      {/* ─── Mission & Vision ─── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            { icon: Target, key: "mission" },
            { icon: Eye, key: "vision" },
          ].map(({ icon: Icon, key }, i) => (
            <SectionFade key={key} delay={i * 0.1}>
              <div className="rounded-2xl border border-border bg-card p-8 h-full space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{t(`${key}_title`)}</h2>
                <p className="text-muted-foreground leading-relaxed">{t(`${key}_desc`)}</p>
              </div>
            </SectionFade>
          ))}
        </div>
      </section>

      {/* ─── Philosophy ─── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <SectionFade>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">{t("phil_title")}</h2>
              <p className="mt-4 text-muted-foreground text-lg">{t("phil_desc")}</p>
            </div>
          </SectionFade>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, key: "lockin" },
              { icon: Coins, key: "pay" },
              { icon: HeartHandshake, key: "honest" },
            ].map(({ icon: Icon, key }, i) => (
              <SectionFade key={key} delay={i * 0.1}>
                <div className="rounded-2xl border border-border bg-card p-8 h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t(`phil_${key}_title`)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`phil_${key}_desc`)}</p>
                </div>
              </SectionFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("team_title")}</h2>
            <p className="text-center text-muted-foreground mb-12">{t("team_sub")}</p>
          </SectionFade>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { key: "victor", initials: "VR" },
              { key: "karen", initials: "KC" },
            ].map(({ key, initials }, i) => (
              <SectionFade key={key} delay={i * 0.15}>
                <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto">
                    {initials}
                  </div>
                  <h3 className="text-xl font-bold">{t(`team_${key}_name`)}</h3>
                  <p className="text-sm font-medium text-primary">{t(`team_${key}_role`)}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`team_${key}_bio`)}</p>
                </div>
              </SectionFade>
            ))}
          </div>
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

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <SectionFade>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("cta_title")}</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t("cta_desc")}</p>
            <Button size="lg" className="h-14 cursor-pointer rounded-full px-10 text-base" render={<a href={calLink} target="_blank" rel="noopener noreferrer" />}>
              <Calendar className="mr-2 h-5 w-5" />
              {t("cta_btn")}
            </Button>
          </SectionFade>
        </div>
      </section>
    </div>
  );
}
