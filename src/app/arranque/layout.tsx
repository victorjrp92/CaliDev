import "@/app/globals.css";
import "@/styles/senal.css";
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Layout del formulario de arranque: mismas fuentes y paleta del sitio, sin
 * cabecera ni navegación. Se llega con un enlace personal.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Arranque · CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

export default function ArranqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">{children}</body>
    </html>
  );
}
