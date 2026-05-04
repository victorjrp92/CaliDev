"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  folder: string;
  className?: string;
}

export function ImageUpload({ value, onChange, folder, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (value) formData.append("oldUrl", value);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      onChange(url);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="group relative aspect-square w-full overflow-hidden rounded-xl border border-border">
          <Image src={value} alt="Upload" fill className="object-cover" sizes="200px" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="cursor-pointer bg-white/90 text-foreground"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1 h-3 w-3" />
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Upload image</span>
        </button>
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
