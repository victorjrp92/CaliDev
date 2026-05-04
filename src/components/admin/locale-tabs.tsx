"use client";

import { useState } from "react";

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
];

interface LocaleTabsProps {
  children: (locale: string) => React.ReactNode;
}

export function LocaleTabs({ children }: LocaleTabsProps) {
  const [active, setActive] = useState("en");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {locales.map((loc) => (
          <button
            key={loc.code}
            type="button"
            onClick={() => setActive(loc.code)}
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active === loc.code
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
