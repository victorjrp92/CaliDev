import "@/app/globals.css";
import "@/styles/senal.css";
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Layout de los contratos: mismas fuentes y paleta que las citas, sin
 * cabecera ni navegación. Se llega desde un enlace personal; el único trabajo
 * de la página es leer y firmar.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Contrato con CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

export default function ContratosLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
