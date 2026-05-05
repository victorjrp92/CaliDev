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
  translations: { locale: string; title: string; description: string; benefit1: string; benefit2: string; benefit3: string }[];
}

export default function ServicesEditorPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/services");
        if (!res.ok) {
          setError("Failed to load services");
          return;
        }
        setServices(await res.json());
      } catch {
        setError("Failed to load services");
      } finally {
        setLoading(false);
      }
    }
    load();
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
    let failed = false;
    for (const svc of services) {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(svc),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error saving ${svc.slug}: ${data.error || res.status}`);
        failed = true;
      }
    }
    setSaving(false);
    if (!failed) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
                onChange={async (url) => {
                  const updated = { ...svc, image_url: url };
                  setServices((prev) => {
                    const copy = [...prev];
                    copy[idx] = updated;
                    return copy;
                  });
                  try {
                    const res = await fetch("/api/admin/services", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updated),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      alert(`Error saving image: ${data.error || res.status}`);
                    }
                  } catch (err) {
                    alert(`Network error saving image: ${err}`);
                  }
                }}
                onRemove={async () => {
                  const updated = { ...svc, image_url: null };
                  setServices((prev) => {
                    const copy = [...prev];
                    copy[idx] = updated;
                    return copy;
                  });
                  try {
                    const res = await fetch("/api/admin/services", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updated),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      alert(`Error removing image: ${data.error || res.status}`);
                    }
                  } catch (err) {
                    alert(`Network error: ${err}`);
                  }
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
                  <div className="space-y-2">
                    <Label>Key Benefits</Label>
                    <Input value={t.benefit1 || ""} onChange={(e) => updateTranslation(idx, locale, "benefit1", e.target.value)} placeholder="Benefit 1" />
                    <Input value={t.benefit2 || ""} onChange={(e) => updateTranslation(idx, locale, "benefit2", e.target.value)} placeholder="Benefit 2" />
                    <Input value={t.benefit3 || ""} onChange={(e) => updateTranslation(idx, locale, "benefit3", e.target.value)} placeholder="Benefit 3" />
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
