import Link from "next/link";
import { Icono } from "./icono";

/** Fila que lleva a otra pantalla: título, una línea de contexto y el chevron. */
export function FilaEnlace({ href, titulo, detalle, alerta }: { href: string; titulo: React.ReactNode; detalle?: React.ReactNode; alerta?: boolean }) {
  return (
    <Link href={href} className="fila-enlace">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="fuerte truncate">{titulo}</span>
        {detalle && <span className={`nota truncate ${alerta ? "!text-[var(--peligro)]" : ""}`}>{detalle}</span>}
      </span>
      <Icono nombre="flecha" tamano={14} grosor={2.2} />
    </Link>
  );
}
