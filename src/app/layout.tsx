import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
