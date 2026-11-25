import Link from "next/link";

/** Fila de filtros: una pastilla por opción; la activa lleva aria-current. Se desplaza de lado en el teléfono. */
export function ChipsFiltro({ etiqueta, opciones }: { etiqueta: string; opciones: { href: string; etiqueta: string; activo: boolean }[] }) {
  return (
    <nav aria-label={etiqueta} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {opciones.map((o) => (
        <Link key={o.href} href={o.href} aria-current={o.activo ? "page" : undefined} className="chip chip-filtro shrink-0">{o.etiqueta}</Link>
      ))}
    </nav>
  );
}
