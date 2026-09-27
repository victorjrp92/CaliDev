import "@/app/globals.css";
import "@/styles/senal.css";
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { contadoresMenu } from "@/lib/social/consultas";
import { panelAbierto, panelConfigurado } from "@/lib/social/sesion";
import { Menu } from "./menu";
import { Puerta } from "./puerta";

/**
 * Layout del centro de operaciones de Instagram. Fuera del sistema de
 * locales (como /servinomic): es una herramienta interna en español. Sin
 * sesión, solo se ve la puerta; nada del panel llega al navegador.
 */
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calidev Social",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const abierto = await panelAbierto();
  const contadores = abierto ? await contadoresMenu() : { porAtender: 0, chats: 0 };

  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {abierto ? (
          <div className="flex min-h-screen">
            <Menu porAtender={contadores.porAtender} chats={contadores.chats} />
            <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
          </div>
        ) : (
          <Puerta configurado={panelConfigurado()} />
        )}
      </body>
    </html>
  );
}
