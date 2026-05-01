"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import Image from "next/image";
import {
  Menu,
  Globe,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";

interface NavLink {
  key: string;
  href: "/" | "/services" | "/blog" | "/contact";
}

const navLinks: NavLink[] = [
  { key: "home", href: "/" },
  { key: "services", href: "/services" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
];

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
];

function LanguageSwitcher() {
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
          <Button variant="ghost" size="icon-sm" aria-label="Change language">
            <Globe className="h-4 w-4" />
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="cursor-pointer"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="cursor-pointer"
        >
          <Image src="/logo.png" alt="CaliDev" width={40} height={40} className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.key}
              variant="ghost"
              size="sm"
              className={`cursor-pointer transition-colors duration-200 ${
                pathname === link.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              render={<Link href={link.href} />}
            >
              {t(link.key)}
            </Button>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            size="sm"
            className="cursor-pointer transition-colors duration-200"
            render={<Link href="/contact" />}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {t("schedule")}
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Image src="/logo.png" alt="CaliDev" width={36} height={36} className="h-9 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4 pt-4">
                {navLinks.map((link) => (
                  <Button
                    key={link.key}
                    variant="ghost"
                    className={`cursor-pointer justify-start text-base transition-colors duration-200 ${
                      pathname === link.href
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                    render={<Link href={link.href} />}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </Button>
                ))}
                <div className="mt-4">
                  <Button
                    className="w-full cursor-pointer transition-colors duration-200"
                    render={<Link href="/contact" />}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("schedule")}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
