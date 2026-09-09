import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Panel } from "@/components/senal/panel";
import type { BlogPost } from "@/lib/blog";

/**
 * Los artículos que aún no están en el idioma de quien mira.
 *
 * Cada uno lleva su idioma escrito y enlaza a su propia versión localizada, no
 * a la del lector: el texto está en inglés, así que la página que lo envuelve
 * también debe estarlo. Mandar a `/es/blog/...` un artículo inglés es
 * exactamente la mezcla que esta sección viene a deshacer.
 */
export function OtrosIdiomas({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("blog");

  return (
    <Panel fondo="niebla">
      <h2 className="text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {t("otros_titulo")}
      </h2>
      <p className="mt-4 max-w-[52ch] leading-[1.65] opacity-70">{t("otros_desc")}</p>

      <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {posts.map((p) => (
          <li key={p.slug} className="border-t border-[var(--linea-tinta)] pt-6">
            <p className="mono text-[var(--verde)]">
              {t(`idioma_${p.locale}`)} · {p.readingTime}
            </p>
            <h3 className="mt-4 text-[1.2rem] font-semibold leading-[1.25] tracking-[-0.02em]">
              <Link href={`/blog/${p.slug}`} locale={p.locale} className="titulo-articulo">
                {p.title}
              </Link>
            </h3>
            <p className="mt-3 leading-[1.6] opacity-70">{p.description}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
