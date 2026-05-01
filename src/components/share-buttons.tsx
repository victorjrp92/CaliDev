"use client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const t = useTranslations("blog");
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const shareLinks = [
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">{t("share")}:</span>
      {shareLinks.map(link => (
        <Button
          key={link.name}
          variant="outline"
          size="sm"
          render={<a href={link.href} target="_blank" rel="noopener noreferrer" />}
          className="cursor-pointer"
        >
          {link.name}
        </Button>
      ))}
    </div>
  );
}
