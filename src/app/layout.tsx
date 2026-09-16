import type { Metadata } from "next";
import { SITIO } from "@/lib/sitio";
import "./globals.css";

export const metadata: Metadata = {
  /**
   * Aquí y no más abajo: `metadataBase` aplica al segmento actual y a todos los
   * de debajo, así que puesto en la raíz cubre también `/servinomic`, que
   * cuelga de este layout aunque tenga su propio `<html>`.
   *
   * Sin él, las imágenes relativas de Open Graph —`/hero/poster.jpg` en la
   * home— no dan error: Next se inventa un origen. En desarrollo pone
   * localhost, y en un build de producción fuera de Vercel también, así que la
   * tarjeta que se comparte en WhatsApp o LinkedIn apunta a una máquina que no
   * existe para quien la abre. El fallo es silencioso salvo por un aviso en el
   * log del build, que es justo el sitio donde nadie mira.
   */
  metadataBase: new URL(SITIO),
  title: {
    template: '%s | CaliDev',
    default: 'CaliDev — Business Efficiency',
  },
  description: 'Digital agency specializing in app development, websites, automations, and digital transformation consulting.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
