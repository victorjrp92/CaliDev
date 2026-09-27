"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Menú del panel: lateral en escritorio, barra inferior en el celular (el
 * diseño aprobado de "Calidev Social"). En el celular caben cinco; Landings,
 * Contactos y Automatizaciones se alcanzan desde Inicio.
 */
type Item = { href: string; texto: string; contador?: number; movil?: boolean; raiz?: boolean };

export function Menu({ porAtender, chats }: { porAtender: number; chats: number }) {
  const ruta = usePathname();
  const items: Item[] = [
    { href: "/social", texto: "Inicio", movil: true, raiz: true },
    { href: "/social/publicaciones", texto: "Publicaciones", movil: true },
    { href: "/social/chats", texto: "Chats", contador: chats, movil: true },
    { href: "/social/atender", texto: "Por atender", contador: porAtender, movil: true },
    { href: "/social/automatizaciones", texto: "Automatizaciones" },
    { href: "/social/landings", texto: "Landings" },
    { href: "/social/contactos", texto: "Contactos" },
    { href: "/social/ajustes", texto: "Ajustes", movil: true },
  ];
  const activo = (it: Item) => (it.raiz ? ruta === "/social" : ruta.startsWith(it.href));

  async function salir() {
    await fetch("/api/social/sesion", { method: "DELETE" });
    window.location.href = "/social";
  }

  return (
    <>
      <aside className="hidden w-[236px] shrink-0 flex-col gap-1 bg-[var(--verde)] px-3.5 py-5 text-[var(--niebla)] md:flex">
        <div className="flex items-center gap-2.5 px-2 pb-5">
          <span className="grid size-[34px] place-items-center rounded-[9px] bg-[var(--lima)] text-lg font-extrabold text-[var(--verde)]">C</span>
          <span>
            <span className="block text-base font-bold text-[var(--hueso)]">Calidev Social</span>
            <span className="block text-xs text-[#B9C9C1]">calidev.dev/social</span>
          </span>
        </div>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={activo(it) ? "page" : undefined}
            className={`flex items-center justify-between rounded-[9px] px-3 py-2.5 text-sm ${
              activo(it) ? "bg-[var(--lima)] font-semibold text-[var(--verde)]" : "hover:bg-white/10"
            }`}
          >
            {it.texto}
            {it.contador ? (
              <span className="rounded-full bg-[#E08A2E] px-2 text-xs font-bold text-[var(--tinta)]">{it.contador}</span>
            ) : null}
          </Link>
        ))}
        <div className="flex-1" />
        <button onClick={salir} className="cursor-pointer rounded-[9px] px-3 py-2.5 text-left text-sm text-[#B9C9C1] hover:bg-white/10">
          Salir
        </button>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--linea-tinta)] bg-white text-center text-[11px] md:hidden">
        {items.filter((it) => it.movil).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={activo(it) ? "page" : undefined}
            className={`relative px-1 pb-5 pt-3 ${activo(it) ? "font-bold text-[var(--verde)]" : "text-[#55635C]"}`}
          >
            {it.texto}
            {it.contador ? (
              <span className="absolute right-2 top-1.5 rounded-full bg-[#E08A2E] px-1.5 text-[10px] font-bold text-[var(--tinta)]">{it.contador}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
