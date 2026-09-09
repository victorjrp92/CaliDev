import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/senal/logo";
import { Relojes } from "@/components/senal/relojes";

/**
 * Pie de página.
 *
 * Va sobre `--verde-hondo`, una capa por debajo del verde de marca, para que se
 * lea como suelo y no como una sección más — es lo único que separa «la página
 * sigue» de «la página se acabó».
 *
 * No hay columna Legal. Las claves `footer.privacy` y `footer.terms` existen
 * desde hace tiempo pero las rutas nunca se crearon, y el sitio se dirige
 * también a Alemania, que exige Impressum y Datenschutzerklärung. Son textos
 * con efecto legal: no se inventan. Un enlace a una página que no existe es un
 * fallo, así que hasta tener el texto la columna se omite.
 */
const REDES = [
  { nombre: "LinkedIn", url: "https://www.linkedin.com/in/victorjrp9/" },
  { nombre: "Instagram", url: "https://instagram.com/calidevdev" },
  { nombre: "GitHub", url: "https://github.com/victorjrp92" },
];

export function Pie() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-[var(--verde-hondo)] px-7 pb-10 pt-20 text-[var(--hueso)] md:px-14 md:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          <div>
            <Logo className="h-7 w-auto" />
            <p className="mt-6 max-w-[30ch] text-lg leading-[1.5] opacity-75">
              {t("tagline")}
            </p>
            <Relojes className="mt-8 opacity-60" />
          </div>

          <nav aria-label={t("company")}>
            <p className="mono text-[var(--lima)]">{t("company")}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {(
                [
                  { href: "/about", texto: tNav("about") },
                  { href: "/blog", texto: tNav("blog") },
                  { href: "/contact", texto: tNav("contact") },
                ] as const
              ).map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="opacity-72 transition-opacity hover:opacity-100">
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Redes">
            <p className="mono text-[var(--lima)]">Redes</p>
            <ul className="mt-5 flex flex-col gap-3">
              {REDES.map((r) => (
                <li key={r.nombre}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-72 transition-opacity hover:opacity-100"
                  >
                    {r.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mono mt-16 flex flex-col gap-4 border-t border-[var(--linea)] pt-8 opacity-50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {anio} CaliDev. {t("rights")}</p>
          <p>Cali · Frankfurt · Sídney</p>
        </div>
      </div>
    </footer>
  );
}
