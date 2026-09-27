import Link from "next/link";
import { Comentario, type ComentarioVista } from "./comentario";

/**
 * Los comentarios que merecen atención, con filtros. "Todos" en la pestaña
 * Comentarios; en el resumen, solo los relevantes.
 */
const FILTROS = [
  { id: "atencion", texto: "Merecen atención" },
  { id: "leads", texto: "Leads" },
  { id: "dudosos", texto: "Dudosos" },
  { id: "criticas", texto: "Críticas" },
  { id: "gustados", texto: "Más gustados" },
  { id: "todos", texto: "Todos" },
] as const;

export function filtrar(cs: ComentarioVista[], f: string): ComentarioVista[] {
  switch (f) {
    case "leads": return cs.filter((c) => c.tipo === "quiere_contacto");
    case "dudosos": return cs.filter((c) => c.estado === "revision");
    case "criticas": return cs.filter((c) => c.tipo === "critica" || c.tipo === "ofensa_spam");
    case "gustados": return [...cs].filter((c) => (c.meGusta ?? 0) > 0).sort((a, b) => (b.meGusta ?? 0) - (a.meGusta ?? 0)).slice(0, 10);
    case "todos": return cs;
    default: return cs.filter((c) => c.tipo === "quiere_contacto" || c.estado === "revision" || c.tipo === "critica" || c.estado === "error");
  }
}

export function ComentariosClave({ mediaId, comentarios, filtro, tab }: {
  mediaId: string; comentarios: ComentarioVista[]; filtro: string; tab: string;
}) {
  const lista = filtrar(comentarios, filtro);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E3E6E0] bg-[#FAFAF7] p-4 sm:p-5">
      <h2 className="text-lg font-bold">Comentarios</h2>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/social/publicaciones/${mediaId}?tab=${tab}&f=${f.id}`}
            aria-current={f.id === filtro ? "true" : undefined}
            className={`rounded-full px-3 py-1 text-xs ${f.id === filtro ? "bg-[var(--tinta)] font-semibold text-white" : "border border-[#D5DAD2] bg-white"}`}
          >
            {f.texto} {filtrar(comentarios, f.id).length}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-[#55635C]">No hay comentarios en este filtro.</p>
      ) : (
        <ul className="flex flex-col gap-2">{lista.map((c) => <Comentario key={c.id} c={c} />)}</ul>
      )}
    </section>
  );
}
