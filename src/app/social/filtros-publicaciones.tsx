import Link from "next/link";
import type { FilaPublicacion } from "@/lib/social/consultas";
import { FILTROS_PUBLICACIONES, filtrarPublicaciones } from "@/lib/social/filtrar-publicaciones";

/** Chips de filtro de la tabla de publicaciones; el filtro va en la URL (?f=). */
export function FiltrosPublicaciones({ filas, actual, base }: { filas: FilaPublicacion[]; actual: string; base: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTROS_PUBLICACIONES.map((f) => (
        <Link
          key={f.id}
          href={`${base}?f=${f.id}`}
          aria-current={f.id === actual ? "true" : undefined}
          className={`rounded-full px-3 py-1 text-xs ${f.id === actual ? "bg-[var(--tinta)] font-semibold text-white" : "border border-[#D5DAD2] bg-white"}`}
        >
          {f.texto} {filtrarPublicaciones(filas, f.id).length}
        </Link>
      ))}
    </div>
  );
}
