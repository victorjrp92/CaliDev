import Link from "next/link";
import type { Persona } from "@/lib/crm/personas";

/** Una persona en la lista: nombre (enlaza a su ficha), empresa y por dónde se le escribe. */
export function FilaPersona({ p }: { p: Persona }) {
  const medios = [p.correo, p.whatsapp ? `+${p.whatsapp}` : null, p.usuario_ig ? `@${p.usuario_ig.replace(/^@/, "")}` : null].filter(Boolean);
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/crm/contactos/${p.id}`} className="font-semibold text-[var(--verde)] underline-offset-4 hover:underline">{p.nombre}</Link>
        {p.origen && <span className="chip">{p.origen}</span>}
      </div>
      {p.empresa && <p className="text-[13.5px] text-[#46554D]">{p.empresa}</p>}
      {medios.length > 0 && <p className="break-words text-[13.5px] text-[#5F6B64]">{medios.join(" · ")}</p>}
    </div>
  );
}
