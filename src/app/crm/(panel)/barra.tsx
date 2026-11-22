import Link from "next/link";
import { Pestanas } from "./pestanas";
import { Salir } from "./salir";

export function Barra({ nombre, pendientes, ajustes }: { nombre: string; pendientes: number; ajustes: boolean }) {
  return (
    <header className="sticky top-0 z-20 bg-[var(--verde)] text-[var(--hueso)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <Link href="/crm/hoy" className="mono rounded text-[var(--hueso)]">
          calidev <span className="text-[var(--lima)]">/</span> crm
        </Link>
        <div className="flex items-center gap-3 text-[13.5px]">
          <span className="hidden text-[var(--hueso)]/75 sm:inline">{nombre}</span>
          <Salir />
        </div>
      </div>
      <Pestanas pendientes={pendientes} ajustes={ajustes} />
    </header>
  );
}
