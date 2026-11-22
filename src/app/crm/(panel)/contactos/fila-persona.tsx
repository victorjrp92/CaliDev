import Link from "next/link";
import type { Persona } from "@/lib/crm/personas";

/** Una persona en la lista: nombre (enlaza a su ficha), empresa y por dónde se le escribe. */
export function FilaPersona({ p, conEmpresa = true }: { p: Persona; conEmpresa?: boolean }) {
  const medios = [p.correo, p.whatsapp ? `+${p.whatsapp}` : null, p.usuario_ig ? `@${p.usuario_ig.replace(/^@/, "")}` : null].filter(Boolean);
  const detalle = [conEmpresa ? p.empresa : null, ...medios].filter(Boolean).join(" · ");
  return (
    <Link href={`/crm/contactos/${p.id}`} className="flex items-center gap-3 px-4 py-3 text-[var(--texto)] hover:bg-[var(--hover)] hover:text-[var(--texto)]">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2"><span className="fuerte">{p.nombre}</span>{p.origen && <span className="chip">{p.origen}</span>}</span>
        {detalle && <span className="nota break-words">{detalle}</span>}
      </span>
      <span aria-hidden className="text-[var(--texto-2)]">›</span>
    </Link>
  );
}
