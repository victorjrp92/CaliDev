import { diaMes } from "@/lib/social/fecha";
import Link from "next/link";

export interface ItemChat {
  igsid: string; usuario: string | null; ultimo: string; ultimoTexto: string | null;
  publicacion: string | null; paso: string | null; rama: string | null; espontaneo: boolean;
}

const ETIQUETA: Record<string, string> = {
  revision: "Te necesita", esperando_boton: "Esperando botón", esperando_texto: "Esperando respuesta",
  asesoria_enviada: "Recibió la asesoría", enviado_aliado: "Enviado a LimpiaExpress",
};

/** Lista de conversaciones con filtros por URL (?f=). */
export function ListaChats({ items, actual, filtro }: { items: ItemChat[]; actual: string | null; filtro: string }) {
  const filtros = [
    { id: "necesitan", texto: "Te necesitan", ok: (i: ItemChat) => i.paso === "revision" || i.espontaneo },
    { id: "agente", texto: "Del agente", ok: (i: ItemChat) => !i.espontaneo },
    { id: "leads", texto: "Leads", ok: (i: ItemChat) => i.rama === "negocio" },
    { id: "todos", texto: "Todos", ok: () => true },
  ];
  const f = filtros.find((x) => x.id === filtro) ?? filtros[3];
  const lista = items.filter(f.ok);
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1.5 border-b border-[#E3E6E0] p-3">
        {filtros.map((x) => (
          <Link key={x.id} href={`/social/chats?f=${x.id}`}
            className={`rounded-full px-3 py-1 text-xs ${x.id === f.id ? "bg-[var(--tinta)] font-semibold text-white" : "border border-[#D5DAD2]"}`}>
            {x.texto} {items.filter(x.ok).length}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? <p className="p-4 text-sm text-[#55635C]">Sin conversaciones en este filtro.</p> : (
        <ul className="flex-1 overflow-y-auto">
          {lista.map((i) => (
            <li key={i.igsid}>
              <Link href={`/social/chats?f=${f.id}&p=${i.igsid}`}
                className={`flex gap-3 border-b border-[#EEF0EB] px-4 py-3 text-sm ${i.igsid === actual ? "bg-[#F1F8E0]" : "hover:bg-[#FAFAF7]"}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--azul)] font-bold text-white">
                  {(i.usuario ?? "?")[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <b className="truncate">@{i.usuario}</b>
                    <span className="shrink-0 text-xs text-[#55635C]">{diaMes(i.ultimo)}</span>
                  </span>
                  <span className="block truncate text-[#33413A]">{i.ultimoTexto ?? "—"}</span>
                  <span className="text-[11px] text-[#55635C]">
                    {i.espontaneo ? "Mensaje directo espontáneo" : `${ETIQUETA[i.paso ?? ""] ?? i.paso}${i.publicacion ? ` · ${i.publicacion}` : ""}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
