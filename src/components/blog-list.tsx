"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { BlogPost } from "@/lib/blog";

/**
 * Listado del blog en SEÑAL.
 *
 * El artículo más reciente ocupa una tarjeta ancha y el resto van en rejilla:
 * en un blog con pocos artículos, tratarlos todos igual hace que ninguno
 * destaque y que la página parezca un archivo en vez de una portada.
 *
 * Los enlaces del título van en verde con subrayado lima. El lima como texto
 * sobre hueso da 1,5:1 y no se puede usar; como subrayado sí, porque ahí es una
 * forma y no un carácter que haya que descifrar.
 */
export function BlogList({ posts, categories }: { posts: BlogPost[]; categories: string[] }) {
  const t = useTranslations("blog");
  const [filtro, setFiltro] = useState<string | null>(null);

  const visibles = filtro ? posts.filter((p) => p.category === filtro) : posts;
  const [destacado, ...resto] = visibles;

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  if (posts.length === 0) return null;

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-14 flex flex-wrap gap-2">
          <Ficha activa={filtro === null} onClick={() => setFiltro(null)}>
            {t("filter_all")}
          </Ficha>
          {categories.map((c) => (
            <Ficha key={c} activa={filtro === c} onClick={() => setFiltro(c)}>
              {c}
            </Ficha>
          ))}
        </div>
      )}

      {destacado && (
        <article className="group border-t-2 border-[var(--verde)] pt-8">
          <p className="mono text-[var(--verde)]">
            {destacado.category} · {fecha(destacado.date)} · {destacado.readingTime}
          </p>
          <h2 className="mt-5 max-w-[20ch] text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance">
            <Link href={`/blog/${destacado.slug}`} className="titulo-articulo">
              {destacado.title}
            </Link>
          </h2>
          <p className="mt-5 max-w-[60ch] text-[1.0625rem] leading-[1.7] opacity-75">
            {destacado.description}
          </p>
        </article>
      )}

      {resto.length > 0 && (
        <ul className="mt-20 grid gap-14 md:grid-cols-2 md:gap-x-12">
          {resto.map((p) => (
            <li key={p.slug} className="border-t border-[var(--linea-tinta)] pt-6">
              <p className="mono text-[var(--verde)]">
                {p.category} · {p.readingTime}
              </p>
              <h3 className="mt-4 text-[clamp(1.3rem,2.4vw,1.7rem)] font-semibold leading-[1.2] tracking-[-0.025em]">
                <Link href={`/blog/${p.slug}`} className="titulo-articulo">
                  {p.title}
                </Link>
              </h3>
              <p className="mt-3 max-w-[52ch] leading-[1.65] opacity-70">{p.description}</p>
              <p className="mono mt-4 opacity-45">{fecha(p.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ficha({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`mono cursor-pointer rounded-full px-4 py-2 transition-colors ${
        activa
          ? "bg-[var(--verde)] text-[var(--hueso)]"
          : "border border-[var(--linea-tinta)] hover:bg-[var(--tinta)]/6"
      }`}
    >
      {children}
    </button>
  );
}
