"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { ImageUpload } from "@/components/admin/image-upload";
import { PhotoPositionAdjuster } from "@/components/admin/photo-position-adjuster";

interface HeroRow {
  locale: string;
  headline: string;
  subtitle: string;
  cta_services: string;
  cta_schedule: string;
  photo_url: string | null;
  photo_position: string;
}

interface PortfolioRow {
  locale: string;
  badge: string;
  title: string;
  role: string;
  description: string;
  profile_name: string;
  profile_subtitle: string;
  profile_bio: string;
  cta: string;
  highlight1_title: string;
  highlight1_desc: string;
  highlight2_title: string;
  highlight2_desc: string;
  highlight3_title: string;
  highlight3_desc: string;
}

export default function HeroEditorPage() {
  const [heroData, setHeroData] = useState<Record<string, HeroRow>>({});
  const [portfolioData, setPortfolioData] = useState<Record<string, PortfolioRow>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [heroRes, portfolioRes] = await Promise.all([
          fetch("/api/admin/hero"),
          fetch("/api/admin/portfolio"),
        ]);
        if (!heroRes.ok || !portfolioRes.ok) {
          setError("Failed to load hero data");
          return;
        }
        const hero = await heroRes.json();
        const portfolio = await portfolioRes.json();

        const hMap: Record<string, HeroRow> = {};
        for (const h of hero) hMap[h.locale] = h;
        setHeroData(hMap);

        const pMap: Record<string, PortfolioRow> = {};
        for (const p of portfolio) pMap[p.locale] = p;
        setPortfolioData(pMap);
      } catch {
        setError("Failed to load hero data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateHero(locale: string, field: string, value: string) {
    setHeroData((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  function updatePortfolio(locale: string, field: string, value: string) {
    setPortfolioData((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    for (const locale of ["en", "es", "de"]) {
      if (heroData[locale]) {
        await fetch("/api/admin/hero", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(heroData[locale]),
        });
      }
      if (portfolioData[locale]) {
        await fetch("/api/admin/portfolio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(portfolioData[locale]),
        });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (error) return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-destructive">{error}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Hero & Profile</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer gap-2">
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </>
          )}
        </Button>
      </div>

      {/* Profile Photo */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile Photo</h2>
        <div className="flex flex-col gap-6">
          <div className="w-32">
            <ImageUpload
              value={heroData.en?.photo_url || null}
              onChange={(url) => {
                for (const locale of ["en", "es", "de"]) {
                  updateHero(locale, "photo_url", url);
                  if (heroData[locale]) {
                    fetch("/api/admin/hero", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...heroData[locale], photo_url: url }),
                    });
                  }
                }
              }}
              folder="hero"
            />
          </div>
          {heroData.en?.photo_url && (
            <PhotoPositionAdjuster
              src={heroData.en.photo_url}
              position={heroData.en?.photo_position || "50% 25%"}
              onChange={(pos) => {
                for (const locale of ["en", "es", "de"]) {
                  updateHero(locale, "photo_position", pos);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Hero Text */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Hero Section</h2>
        <LocaleTabs>
          {(locale) => {
            const h = heroData[locale];
            if (!h) return <p className="text-muted-foreground">Loading...</p>;
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Textarea value={h.headline} onChange={(e) => updateHero(locale, "headline", e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={h.subtitle} onChange={(e) => updateHero(locale, "subtitle", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Services</Label>
                    <Input value={h.cta_services} onChange={(e) => updateHero(locale, "cta_services", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Schedule</Label>
                    <Input value={h.cta_schedule} onChange={(e) => updateHero(locale, "cta_schedule", e.target.value)} />
                  </div>
                </div>
              </div>
            );
          }}
        </LocaleTabs>
      </div>

      {/* Portfolio Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Portfolio / iPad Content</h2>
        <LocaleTabs>
          {(locale) => {
            const p = portfolioData[locale];
            if (!p) return <p className="text-muted-foreground">Loading...</p>;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Badge</Label>
                    <Input value={p.badge} onChange={(e) => updatePortfolio(locale, "badge", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button</Label>
                    <Input value={p.cta} onChange={(e) => updatePortfolio(locale, "cta", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={p.title} onChange={(e) => updatePortfolio(locale, "title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={p.role} onChange={(e) => updatePortfolio(locale, "role", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={p.description} onChange={(e) => updatePortfolio(locale, "description", e.target.value)} rows={3} />
                </div>

                <h3 className="pt-2 text-sm font-semibold text-muted-foreground">Profile Card</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Name</Label>
                    <Input value={p.profile_name} onChange={(e) => updatePortfolio(locale, "profile_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Profile Subtitle</Label>
                    <Input value={p.profile_subtitle} onChange={(e) => updatePortfolio(locale, "profile_subtitle", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Profile Bio</Label>
                  <Textarea value={p.profile_bio} onChange={(e) => updatePortfolio(locale, "profile_bio", e.target.value)} rows={2} />
                </div>

                <h3 className="pt-2 text-sm font-semibold text-muted-foreground">Highlights</h3>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Highlight {n} Title</Label>
                      <Input
                        value={(p as unknown as Record<string, string>)[`highlight${n}_title`] || ""}
                        onChange={(e) => updatePortfolio(locale, `highlight${n}_title`, e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Highlight {n} Description</Label>
                      <Input
                        value={(p as unknown as Record<string, string>)[`highlight${n}_desc`] || ""}
                        onChange={(e) => updatePortfolio(locale, `highlight${n}_desc`, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </LocaleTabs>
      </div>
    </div>
  );
}
