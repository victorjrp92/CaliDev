import Link from "next/link";

/** Cambio rápido entre publicaciones (miniaturas). */
export function Selector({ actual, lista }: { actual: string; lista: { mediaId: string; titulo: string; miniatura: string | null }[] }) {
  return (
    <nav aria-label="Otras publicaciones" className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[13px] text-[#55635C]">Cambiar:</span>
      {lista.map((p) => (
        <Link
          key={p.mediaId}
          href={`/social/publicaciones/${p.mediaId}`}
          title={p.titulo}
          aria-label={p.titulo}
          aria-current={p.mediaId === actual ? "page" : undefined}
          className={`block h-11 w-9 shrink-0 overflow-hidden rounded-md ${p.mediaId === actual ? "ring-2 ring-[var(--verde)] ring-offset-2" : "opacity-80 hover:opacity-100"}`}
        >
          {p.miniatura ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.miniatura} alt="" className="h-full w-full object-cover" />
          ) : <span className="block h-full w-full bg-[var(--azul)]" />}
        </Link>
      ))}
    </nav>
  );
}
