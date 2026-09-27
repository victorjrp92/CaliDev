import { fechaLarga } from "@/lib/social/fecha";
import Link from "next/link";
import { ModoAgente } from "../../ui/modo";

/** Cabecera de la publicación: qué es, cómo está configurado su agente y atajos. */
export function Encabezado({ d }: {
  d: { mediaId: string; titulo: string; caption: string | null; permalink: string | null; miniatura: string | null;
    tipo: string | null; publicado: string | null; modo: string | null; sensible: boolean; landing: string | null; palabrasClave: string[] };
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#E3E6E0] bg-white p-4 sm:flex-row sm:p-5">
      {d.miniatura ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.miniatura} alt="" className="h-40 w-32 shrink-0 rounded-xl object-cover" />
      ) : <div className="h-40 w-32 shrink-0 rounded-xl bg-[var(--azul)]" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">{d.titulo}</h1>
          <ModoAgente modo={d.modo} sensible={d.sensible} />
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-[#33413A]">{d.caption}</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-[#55635C]">Landing</dt><dd className="truncate">{d.landing ? d.landing.replace(/^https:\/\//, "") : "Sin landing"}</dd></div>
          <div><dt className="text-[#55635C]">Palabras clave</dt><dd>{d.palabrasClave.length ? d.palabrasClave.map((p) => p.toUpperCase()).join(" · ") : "—"}</dd></div>
          <div><dt className="text-[#55635C]">Publicado</dt><dd>{d.publicado ? fechaLarga(d.publicado) : "—"}</dd></div>
        </dl>
      </div>
      <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
        <Link href={`/social/automatizaciones/${d.mediaId}`} className="rounded-xl border border-[#D5DAD2] px-4 py-2.5 text-center text-sm font-semibold text-[var(--tinta)]">
          {d.modo ? "Editar automatización" : "Automatizar"}
        </Link>
        {d.permalink && (
          <a href={d.permalink} target="_blank" rel="noreferrer" className="rounded-xl border border-[#D5DAD2] px-4 py-2.5 text-center text-sm text-[var(--tinta)]">
            Ver en Instagram ↗
          </a>
        )}
      </div>
    </section>
  );
}
