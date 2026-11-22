"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/crm/hoy", texto: "Hoy" },
  { href: "/crm/ventas", texto: "Ventas" },
  { href: "/crm/contactos", texto: "Contactos" },
  { href: "/crm/agenda", texto: "Agenda" },
  { href: "/crm/aprobaciones", texto: "Aprobaciones" },
];

/** En el teléfono las pestañas se desplazan de lado; nunca se parten en dos filas. */
export function Pestanas({ pendientes, ajustes }: { pendientes: number; ajustes: boolean }) {
  const ruta = usePathname();
  const lista = ajustes ? [...PESTANAS, { href: "/crm/ajustes", texto: "Ajustes" }] : PESTANAS;
  return (
    <nav aria-label="Secciones" className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-1">
        {lista.map((p) => {
          const activa = ruta === p.href || ruta.startsWith(`${p.href}/`);
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`relative flex h-11 items-center gap-2 px-3 text-[14.5px] font-medium ${activa ? "text-[var(--hueso)]" : "text-[var(--hueso)]/70 hover:text-[var(--hueso)]"}`}
              >
                {p.texto}
                {p.href === "/crm/aprobaciones" && pendientes > 0 && (
                  <span className="cifra rounded-full bg-[var(--lima)] px-1.5 text-[12px] font-semibold text-[var(--tinta)]">{pendientes}</span>
                )}
                {activa && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[var(--lima)]" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
