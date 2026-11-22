import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import "@/styles/crm.css";

/**
 * El CRM interno de Calidev. Es una herramienta, no una página: fuente del
 * sistema, claro u oscuro según el dispositivo y sin header ni footer del sitio.
 */
export const metadata: Metadata = {
  title: { template: "%s · CRM Calidev", default: "CRM Calidev" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECEEEA" },
    { media: "(prefers-color-scheme: dark)", color: "#121413" },
  ],
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="crm min-h-dvh">{children}</body>
    </html>
  );
}
