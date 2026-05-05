"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, Save, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { ImageUpload } from "@/components/admin/image-upload";

interface TestimonialRow {
  id: number;
  author: string;
  role: string;
  rating: number;
  avatar_url: string | null;
  translations: { locale: string; quote: string }[];
}

export default function TestimonialsEditorPage() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/testimonials");
        if (!res.ok) {
          setError("Failed to load testimonials");
          return;
        }
        setTestimonials(await res.json());
      } catch {
        setError("Failed to load testimonials");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateField(idx: number, field: string, value: string | number) {
    setTestimonials((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  function updateQuote(idx: number, locale: string, value: string) {
    setTestimonials((prev) => {
      const updated = [...prev];
      const t = { ...updated[idx] };
      t.translations = t.translations.map((tr) =>
        tr.locale === locale ? { ...tr, quote: value } : tr
      );
      updated[idx] = t;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    for (const t of testimonials) {
      if (t.id < 0) {
        await fetch("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
      } else {
        await fetch("/api/admin/testimonials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
      }
    }
    const res = await fetch("/api/admin/testimonials");
    setTestimonials(await res.json());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addTestimonial() {
    setTestimonials((prev) => [
      ...prev,
      {
        id: -Date.now(),
        author: "",
        role: "",
        rating: 5,
        avatar_url: null,
        translations: [
          { locale: "en", quote: "" },
          { locale: "es", quote: "" },
          { locale: "de", quote: "" },
        ],
      },
    ]);
  }

  async function removeTestimonial(idx: number) {
    const t = testimonials[idx];
    if (t.id > 0) {
      await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
    }
    setTestimonials((prev) => prev.filter((_, i) => i !== idx));
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
          <MessageSquareQuote className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Testimonials</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addTestimonial} className="cursor-pointer gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
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
      </div>

      {testimonials.map((t, idx) => (
        <div key={t.id} className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-20">
                <ImageUpload
                  value={t.avatar_url}
                  onChange={(url) => updateField(idx, "avatar_url", url)}
                  folder="testimonials"
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Author</Label>
                  <Input value={t.author} onChange={(e) => updateField(idx, "author", e.target.value)} className="w-64" />
                </div>
                <div className="space-y-1">
                  <Label>Company / Role</Label>
                  <Input value={t.role} onChange={(e) => updateField(idx, "role", e.target.value)} className="w-64" />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-destructive hover:text-destructive"
              onClick={() => removeTestimonial(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <LocaleTabs>
            {(locale) => {
              const tr = t.translations.find((x) => x.locale === locale);
              return (
                <div className="space-y-2">
                  <Label>Quote ({locale.toUpperCase()})</Label>
                  <Textarea
                    value={tr?.quote || ""}
                    onChange={(e) => updateQuote(idx, locale, e.target.value)}
                    rows={3}
                  />
                </div>
              );
            }}
          </LocaleTabs>
        </div>
      ))}
    </div>
  );
}
