import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "@/app/globals.css";
import "@/app/nuevo/senal.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "800"],
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500"],
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaliDev",
  robots: { index: false, follow: false },
};

/**
 * Cáscara del home nuevo. Vive fuera de `[locale]` a propósito: no hereda
 * header ni footer del sitio actual, así el hero se ve solo. El i18n entra
 * cuando el diseño esté cerrado.
 */
export default function NuevoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable} ${instrument.variable}`}>
      <body className="senal min-h-screen bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
