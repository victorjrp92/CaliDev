import "@/app/globals.css";
import "@/styles/senal.css";
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Layout de la agenda pública: mismas fuentes y paleta que las citas, sin
 * cabecera ni navegación. Se llega desde Instagram; su único trabajo es elegir
 * una hora.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Agenda tu videollamada gratuita · CaliDev",
  description: "Elige un horario para una videollamada gratuita de una hora con CaliDev.",
  robots: { index: false, follow: false },
};

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
