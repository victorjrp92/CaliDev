import Link from "next/link";
import { listaLandings } from "@/lib/social/consultas";
import { panelAbierto } from "@/lib/social/sesion";
import { LandingMapa } from "../publicaciones/[id]/landing-mapa";

export const dynamic = "force-dynamic";

/** Todas las landings medidas (30 días) y, al elegir una, su mapa de calor. */
export default async function LandingsPage({ searchParams }: { searchParams: Promise<{ l?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { l } = await searchParams;
  const filas = await listaLandings();
  const ruta = l && l.startsWith("/") ? l : null;

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-7 md:px-8">
      <h1 className="text-[28px] font-extrabold tracking-tight">Landings</h1>
      <section className="overflow-hidden rounded-2xl border border-[#E3E6E0] bg-white">
        <div className="hidden grid-cols-[2fr_repeat(6,1fr)] gap-3 bg-[#F4F5F1] px-5 py-2.5 text-xs uppercase tracking-wide text-[#55635C] md:grid">
          <span>Landing</span><span>Visitas</span><span>Desde Instagram</span><span>Celular</span><span>Bajan</span><span>Formularios</span><span>Videos</span>
        </div>
        <ul>
          {filas.map((f) => (
            <li key={f.ruta} className="border-t border-[#EEF0EB] first:border-t-0">
              <Link href={`/social/landings?l=${encodeURIComponent(f.ruta)}`} aria-current={f.ruta === ruta ? "page" : undefined}
                className={`grid gap-2 px-5 py-3.5 text-sm md:grid-cols-[2fr_repeat(6,1fr)] md:items-center md:gap-3 ${f.ruta === ruta ? "bg-[#F1F8E0]" : "hover:bg-[#FAFAF7]"}`}>
                <span className="font-semibold">calidev.dev{f.ruta}</span>
                <span className="flex flex-wrap gap-x-4 md:contents">
                  <span><span className="text-[#55635C] md:hidden">Visitas </span>{f.visitas}</span>
                  <span><span className="text-[#55635C] md:hidden">Desde IG </span>{f.desdeIg}</span>
                  <span><span className="text-[#55635C] md:hidden">Celular </span>{f.celular} %</span>
                  <span><span className="text-[#55635C] md:hidden">Bajan </span>{f.scroll} %</span>
                  <span><span className="text-[#55635C] md:hidden">Formularios </span>{f.leads}{f.completos ? ` (${f.completos} completos)` : ""}</span>
                  <span><span className="text-[#55635C] md:hidden">Videos </span>{f.publicaciones}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {ruta && (
        <>
          <h2 className="mt-2 text-lg font-bold">Mapa de calor · calidev.dev{ruta}</h2>
          <LandingMapa ruta={ruta} mediaId={null} />
        </>
      )}
    </main>
  );
}
