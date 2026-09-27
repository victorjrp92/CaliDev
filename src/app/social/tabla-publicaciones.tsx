import { diaMes } from "@/lib/social/fecha";
import Link from "next/link";
import type { FilaPublicacion } from "@/lib/social/consultas";
import { ModoAgente } from "./ui/modo";

/**
 * Todas las publicaciones con el estado de su agente. En el celular cada fila
 * se apila como tarjeta: una tabla de siete columnas no cabe en 390 px.
 */
const cifra = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-CO"));

export function TablaPublicaciones({ filas }: { filas: FilaPublicacion[] }) {
  if (!filas.length) {
    return (
      <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">
        Todavía no hay publicaciones. Ve a <Link href="/social/ajustes" className="font-semibold underline">Ajustes</Link> y pulsa «Traer publicaciones».
      </p>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E3E6E0] bg-white">
      <h2 className="border-b border-[#E3E6E0] px-5 py-4 text-lg font-bold">Tus publicaciones</h2>
      <div className="hidden grid-cols-[2.4fr_1.1fr_1.6fr_0.8fr_0.9fr_0.7fr_0.8fr] gap-3 bg-[#F4F5F1] px-5 py-2.5 text-xs uppercase tracking-wide text-[#55635C] lg:grid">
        <span>Publicación</span><span>Agente</span><span>Landing</span><span>Vistas</span><span>Comentarios</span><span>Leads</span><span>Atender</span>
      </div>
      <ul>
        {filas.map((f) => (
          <li key={f.mediaId} className="border-t border-[#EEF0EB] first:border-t-0">
            <Link
              href={`/social/publicaciones/${f.mediaId}`}
              className="grid gap-2 px-5 py-3.5 text-sm hover:bg-[#FAFAF7] lg:grid-cols-[2.4fr_1.1fr_1.6fr_0.8fr_0.9fr_0.7fr_0.8fr] lg:items-center lg:gap-3"
            >
              <span className="flex items-center gap-3">
                {f.miniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.miniatura} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-14 w-11 shrink-0 rounded-lg bg-[var(--azul)]" />
                )}
                <span className="min-w-0">
                  <span className="block font-semibold">{f.titulo}</span>
                  <span className="text-[13px] text-[#55635C]">
                    {f.tipo === "REELS" ? "Reel" : "Publicación"} · {f.publicado ? diaMes(f.publicado) : ""}
                  </span>
                </span>
              </span>
              <span><ModoAgente modo={f.modo} sensible={f.sensible} /></span>
              <span className={`truncate text-[13px] ${f.landing ? "" : "text-[#8A4B0B]"}`}>
                {f.landing ? f.landing.replace(/^https:\/\//, "") : "Sin landing"}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] lg:contents">
                <span><span className="lg:hidden text-[#55635C]">Vistas </span>{cifra(f.vistas)}</span>
                <span><span className="lg:hidden text-[#55635C]">Comentarios </span>{cifra(f.comentarios)}</span>
                <span><span className="lg:hidden text-[#55635C]">Leads </span>{cifra(f.leads)}</span>
                <span>
                  {f.revision > 0 ? (
                    <span className="rounded-full bg-[#E08A2E] px-2.5 py-0.5 text-xs font-bold text-[var(--tinta)]">{f.revision}</span>
                  ) : <span className="text-[#55635C]">—</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
