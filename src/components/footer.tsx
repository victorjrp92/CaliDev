"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";
import { Globe } from "lucide-react";
import { InstagramIcon, LinkedInIcon, GitHubIcon } from "@/components/social-icons";

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/victorjrp9/", icon: LinkedInIcon },
  { label: "Instagram", href: "https://instagram.com/calidevdev", icon: InstagramIcon },
  { label: "GitHub", href: "https://github.com/victorjrp92", icon: GitHubIcon },
];

function FooterLanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleLocaleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  const currentLocale = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer"
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-background/70 hover:text-background"
          >
            <Globe className="mr-1.5 h-4 w-4" />
            {currentLocale?.label ?? "Language"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8}>
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            className={`cursor-pointer ${loc.code === locale ? "font-semibold text-primary" : ""}`}
            onSelect={() => handleLocaleChange(loc.code)}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="cursor-pointer inline-block">
              <Image src="/logo.png" alt="CaliDev" width={48} height={48} className="h-12 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm leading-relaxed text-background/70">
              {t("tagline")}
            </p>
          </div>

          {/* Services column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              {nav("services")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services#mobile"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("service_mobile")}
                </Link>
              </li>
              <li>
                <Link
                  href="/services#web"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("service_web")}
                </Link>
              </li>
              <li>
                <Link
                  href="/services#automation"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("service_automation")}
                </Link>
              </li>
              <li>
                <Link
                  href="/services#analytics"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("service_analytics")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              {t("company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {nav("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {nav("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="cursor-pointer text-sm text-background/70 transition-colors duration-200 hover:text-background"
                >
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Social links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="cursor-pointer rounded-full p-2 text-background/50 transition-colors duration-200 hover:text-background"
              >
                <link.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          {/* Language selector */}
          <FooterLanguageSwitcher />

          {/* Copyright */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-background/50">
              {t("copyright", { year: currentYear })}
            </p>
            <a
              href="/admin/payments"
              className="text-xs text-background/20 transition-colors hover:text-background/50"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
