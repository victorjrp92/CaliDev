"use client";

import { useEffect, useState } from "react";
import { Share2, Save, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SocialLink {
  id: number;
  label: string;
  handle: string;
  href: string;
  icon: string;
}

const iconOptions = ["linkedin", "instagram", "github", "x"];

export default function SocialEditorPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/social");
        if (!res.ok) {
          setError("Failed to load social links");
          return;
        }
        setLinks(await res.json());
      } catch {
        setError("Failed to load social links");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateLink(idx: number, field: string, value: string) {
    setLinks((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    for (const link of links) {
      if (link.id < 0) {
        await fetch("/api/admin/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(link),
        });
      } else {
        await fetch("/api/admin/social", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(link),
        });
      }
    }
    const res = await fetch("/api/admin/social");
    setLinks(await res.json());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addLink() {
    setLinks((prev) => [
      ...prev,
      { id: -Date.now(), label: "", handle: "", href: "", icon: "linkedin" },
    ]);
  }

  async function removeLink(idx: number) {
    const link = links[idx];
    if (link.id > 0) {
      await fetch("/api/admin/social", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id }),
      });
    }
    setLinks((prev) => prev.filter((_, i) => i !== idx));
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
          <Share2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Social Links</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addLink} className="cursor-pointer gap-2">
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

      {links.map((link, idx) => (
        <div key={link.id} className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Input value={link.label} onChange={(e) => updateLink(idx, "label", e.target.value)} placeholder="e.g. LinkedIn" />
              </div>
              <div className="space-y-2">
                <Label>Handle</Label>
                <Input value={link.handle} onChange={(e) => updateLink(idx, "handle", e.target.value)} placeholder="e.g. @username" />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={link.href} onChange={(e) => updateLink(idx, "href", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={link.icon}
                  onChange={(e) => updateLink(idx, "icon", e.target.value)}
                >
                  {iconOptions.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 cursor-pointer text-destructive hover:text-destructive"
              onClick={() => removeLink(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
