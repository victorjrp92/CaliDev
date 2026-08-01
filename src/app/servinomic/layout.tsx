import "@/app/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Layout propio, fuera del sistema de locales.
 *
 * Deliberadamente sin Header, Footer, nav ni selector de idioma: cada link de
 * salida es una fuga en una página cuyo único trabajo es llevar al formulario.
 * Tampoco hay ThemeProvider — la landing se ve igual para todo el mundo y no
 * depende de la preferencia de tema del visitante.
 *
 * El padding inferior deja espacio para la barra fija de CTA.
 */
export default function ServinomicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="bg-[#FBF8F3] pb-[104px] font-sans text-[#15211C] antialiased">
        {children}
      </body>
    </html>
  );
}
