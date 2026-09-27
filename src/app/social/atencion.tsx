import Link from "next/link";
import type { ItemAtender } from "@/lib/social/consultas";
import { TipoJev } from "./ui/tipo";

/** Los primeros casos que esperan a Victor, de todas las publicaciones. */
export function Atencion({ items }: { items: ItemAtender[] }) {
  return (
    <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Presta atención a esto</h2>
        {items.length > 0 && <Link href="/social/atender" className="text-sm font-semibold">Ver los {items.length} →</Link>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#55635C]">Nada pendiente. El agente está al día.</p>
      ) : (
        <ul className="flex flex-col gap-2.5 text-sm">
          {items.slice(0, 4).map((i) => (
            <li key={i.clase + i.id} className="rounded-xl border border-[#E3E6E0] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <b>@{i.usuario}</b>
                {i.clase === "mensaje" ? (
                  <span className="rounded-md bg-[#E9F3FF] px-2 py-0.5 text-xs font-semibold text-[#1F4E8C]">Mensaje directo</span>
                ) : (
                  <TipoJev tipo={i.tipo} confianza={i.confianza} />
                )}
                {i.publicacion && <span className="text-xs text-[#55635C]">en {i.publicacion}</span>}
              </div>
              <p className="mt-1 text-[#33413A]">«{i.texto}»</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
