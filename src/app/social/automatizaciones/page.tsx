import Link from "next/link";
import { automatizacionesLista } from "@/lib/social/consultas";
import { fechaHora } from "@/lib/social/fecha";
import { panelAbierto } from "@/lib/social/sesion";
import { ModoAgente } from "../ui/modo";
import { ElegirPublicacion } from "./elegir";

export const dynamic = "force-dynamic";

const FILTROS = [
  { id: "todas", texto: "Todas", ok: () => true },
  { id: "activas", texto: "Activas", ok: (a: { modo: string }) => a.modo === "automatico" },
  { id: "borradores", texto: "Solo borradores", ok: (a: { modo: string }) => a.modo === "borradores" },
  { id: "apagadas", texto: "Apagadas", ok: (a: { modo: string }) => a.modo === "apagado" },
  { id: "sensibles", texto: "Tema sensible", ok: (a: { sensible: boolean }) => a.sensible },
];

export default async function AutomatizacionesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { f } = await searchParams;
  const { filas, sinAutomatizar } = await automatizacionesLista();
  const filtro = FILTROS.find((x) => x.id === f) ?? FILTROS[0];
  const lista = filas.filter((a) => filtro.ok(a));

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-7 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold tracking-tight">Automatizaciones</h1>
        <ElegirPublicacion opciones={sinAutomatizar} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((x) => (
          <Link key={x.id} href={`/social/automatizaciones?f=${x.id}`} aria-current={x.id === filtro.id ? "true" : undefined}
            className={`rounded-full px-3 py-1 text-xs ${x.id === filtro.id ? "bg-[var(--tinta)] font-semibold text-white" : "border border-[#D5DAD2] bg-white"}`}>
            {x.texto} {filas.filter((a) => x.ok(a)).length}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">
          {filas.length === 0 ? "Ninguna publicación está automatizada todavía. Elige una arriba." : "Nada en este filtro."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((a) => (
            <li key={a.mediaId} className="grid gap-3 rounded-2xl border border-[#E3E6E0] bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex gap-3">
                {a.miniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.miniatura} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
                ) : <span className="h-16 w-12 shrink-0 rounded-lg bg-[var(--azul)]" />}
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/social/publicaciones/${a.mediaId}`} className="font-semibold">{a.titulo}</Link>
                    <ModoAgente modo={a.modo} sensible={a.sensible} />
                  </div>
                  <p className="mt-1 text-[13px] text-[#55635C]">
                    {a.landing ? a.landing.replace(/^https:\/\//, "") : <span className="text-[#8A4B0B]">Sin landing</span>}
                    {" · "}claves: {a.palabrasClave.length ? a.palabrasClave.join(", ") : "—"}
                    {a.activadoEn && <> · activa desde {fechaHora(a.activadoEn)}</>}
                    {a.modo !== "apagado" && a.proximaRevision && <> · próxima revisión {fechaHora(a.proximaRevision)}</>}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-[13px]">
                    <span>{a.procesados} comentarios procesados</span>
                    <span>{a.leads} leads</span>
                    {a.revision > 0 && <span className="font-semibold text-[#8A4B0B]">{a.revision} por atender</span>}
                  </p>
                </div>
              </div>
              <Link href={`/social/automatizaciones/${a.mediaId}`} className="rounded-xl border border-[#D5DAD2] px-4 py-2.5 text-center text-sm font-semibold">
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
