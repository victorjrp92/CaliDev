"use client";

import { useEffect, useState } from "react";
import { Briefcase, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { ImageUpload } from "@/components/admin/image-upload";

interface ServiceRow {
  id: number;
  slug: string;
  icon: string;
  image_url: string | null;
  translations: { locale: string; title: string; description: string }[];
}

export default function ServicesEditorPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then(setServices);
  }, []);

  function updateTranslation(serviceIdx: number, locale: string, field: string, value: string) {
    setServices((prev) => {
      const updated = [...prev];
      const svc = { ...updated[serviceIdx] };
      svc.translations = svc.translations.map((t) =>
        t.locale === locale ? { ...t, [field]: value } : t
      );
      updated[serviceIdx] = svc;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    for (const svc of services) {
      await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(svc),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Services</h1>
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

      {services.map((svc, idx) => (
        <div key={svc.id} className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="w-20">
              <ImageUpload
                value={svc.image_url}
                onChange={(url) => {
                  setServices((prev) => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], image_url: url };
                    return updated;
                  });
                }}
                folder="services"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold capitalize">{svc.slug}</h2>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{svc.icon}</span>
              <p className="mt-1 text-xs text-muted-foreground">Image replaces the icon on the public site</p>
            </div>
          </div>
          <LocaleTabs>
            {(locale) => {
              const t = svc.translations.find((tr) => tr.locale === locale);
              if (!t) return <p className="text-muted-foreground">No translation</p>;
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={t.title} onChange={(e) => updateTranslation(idx, locale, "title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={t.description} onChange={(e) => updateTranslation(idx, locale, "description", e.target.value)} rows={3} />
                  </div>
                </div>
              );
            }}
          </LocaleTabs>
        </div>
      ))}
    </div>
  );
}
