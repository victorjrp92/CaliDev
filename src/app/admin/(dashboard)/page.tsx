"use client";

import { LayoutDashboard, Image as ImageIcon, Briefcase, MessageSquareQuote, Share2 } from "lucide-react";
import Link from "next/link";

const cards = [
  { label: "Hero & Profile", href: "/admin/hero", icon: ImageIcon, desc: "Edit hero text, photo, and portfolio content" },
  { label: "Services", href: "/admin/services", icon: Briefcase, desc: "Manage your service offerings" },
  { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, desc: "Edit client testimonials" },
  { label: "Social Links", href: "/admin/social", icon: Share2, desc: "Update your social media links" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <Icon className="mb-3 h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
              <h2 className="text-sm font-semibold">{card.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
