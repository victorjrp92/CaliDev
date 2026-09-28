import "@/app/globals.css";
import "@/styles/senal.css";
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Layout de las páginas de cita: las mismas fuentes y la paleta de la landing,
 * sin cabecera ni navegación. Es una página personal a la que se llega desde
 * un correo; su único trabajo es elegir y confirmar una hora.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Tu videollamada con CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

export default function CitaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
