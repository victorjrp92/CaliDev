import "@/app/globals.css";
import "@/styles/senal.css";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * Las mismas dos tipografías del sitio: Archivo para todo y Plex Mono para los
 * rótulos. La landing la abre alguien que acaba de ver un video y muchos
 * llegarán después a calidev.dev; si las dos páginas no se parecen, la segunda
 * visita se siente otra empresa.
 *
 * Instrument Serif no entra: aquí no hay tipografía cinética, y es una fuente
 * menos que descargar en un móvil con datos.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
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
 * `senal` trae los tokens de la paleta; el padding inferior deja espacio para
 * la barra fija de CTA.
 */
export default function ServinomicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${archivo.variable} ${plex.variable}`}>
      <body className="senal bg-[var(--hueso)] pb-[104px] font-[family-name:var(--font-archivo)] text-[var(--tinta)] antialiased">
        {children}
      </body>
    </html>
  );
}
