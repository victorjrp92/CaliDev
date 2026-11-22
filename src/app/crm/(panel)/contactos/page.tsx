import type { Metadata } from "next";
import Link from "next/link";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { buscarPersonas } from "@/lib/crm/personas";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaPersona } from "./fila-persona";
import { NuevaPersona } from "./nueva-persona";

export const metadata: Metadata = { title: "Contactos" };

/** Personas del CRM: las más recientes, o las que coinciden con `?q=`. */
export default async function Contactos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "contactos:leer")) return <SinPermiso que="los contactos" />;
  const q = ((await searchParams).q ?? "").trim();
  const personas = await buscarPersonas(q || null, 100);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="mono text-[var(--verde)]">Personas</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-[34px]">Contactos</h1>
      </header>

      <form method="get" role="search" className="flex flex-wrap gap-2">
        <input type="search" name="q" defaultValue={q} aria-label="Buscar contactos" placeholder="Nombre, correo, WhatsApp, Instagram o empresa" className="campo min-w-0 flex-1" />
        <button type="submit" className="boton-secundario">Buscar</button>
        {q && <Link href="/crm/contactos" className="boton-secundario">Limpiar</Link>}
      </form>

      {tiene(a, "contactos:escribir") && <NuevaPersona />}

      {personas.length ? (
        <div className="bloque divide-y divide-[var(--linea-tinta)]">{personas.map((p) => <FilaPersona key={p.id} p={p} />)}</div>
      ) : (
        <Vacio>{q ? `Nadie coincide con «${q}».` : "Todavía no hay personas. Crea la primera arriba."}</Vacio>
      )}
    </div>
  );
}
