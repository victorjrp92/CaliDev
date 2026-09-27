import Link from "next/link";

export const PESTANAS = [
  { id: "resumen", texto: "Resumen" },
  { id: "video", texto: "Video y gancho" },
  { id: "comentarios", texto: "Comentarios" },
  { id: "landing", texto: "Landing y mapa de calor" },
] as const;
export type Pestana = (typeof PESTANAS)[number]["id"];

export function Pestanas({ mediaId, actual }: { mediaId: string; actual: Pestana }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[#E3E6E0]">
      {PESTANAS.map((p) => (
        <Link
          key={p.id}
          href={`/social/publicaciones/${mediaId}?tab=${p.id}`}
          aria-current={p.id === actual ? "page" : undefined}
          className={`shrink-0 border-b-[3px] px-3.5 py-2.5 text-sm ${p.id === actual ? "border-[var(--verde)] font-semibold" : "border-transparent text-[#55635C]"}`}
        >
          {p.texto}
        </Link>
      ))}
    </nav>
  );
}
