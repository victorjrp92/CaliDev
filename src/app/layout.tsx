import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | Victor Ramos BE',
    default: 'Victor Ramos BE — Business Efficiency',
  },
  description: 'Digital agency specializing in app development, websites, automations, and digital transformation consulting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
