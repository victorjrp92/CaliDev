import Link from "next/link";
import type { Recomendacion } from "@/lib/social/recomendaciones";

export function ListaRecomendaciones({ items }: { items: Recomendacion[] }) {
  return (
    <section className="rounded-2xl bg-[var(--azul)] p-5 text-[var(--niebla)]">
      <h2 className="mb-3 text-lg font-bold text-white">Recomendaciones</h2>
      {items.length === 0 ? (
        <p className="text-sm">Nada que recomendar por ahora: se calculan con tus datos reales.</p>
      ) : (
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          {items.map((r, i) => (
            <li key={i}>
              {r.mediaId ? <Link href={`/social/publicaciones/${r.mediaId}`} className="text-[var(--niebla)] underline decoration-[var(--lima)]">{r.texto}</Link> : r.texto}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
