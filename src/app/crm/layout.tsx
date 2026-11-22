import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import "@/styles/senal.css";
import "@/styles/crm.css";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * El CRM interno de Calidev. Mismas tipografías y paleta SEÑAL que el sitio:
 * Archivo para todo y Plex Mono para rótulos y cifras. Sin header ni footer
 * del sitio: es una herramienta, no una página.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: { template: "%s · CRM Calidev", default: "CRM Calidev" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#0a3d2e" };

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal min-h-dvh bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
