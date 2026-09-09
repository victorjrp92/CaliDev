"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { Relojes } from "@/components/senal/relojes";
import type { EnlaceNav } from "@/components/senal/enlaces-nav";

/**
 * Menú de móvil: capa verde a pantalla completa.
 *
 * A pantalla completa y no un desplegable porque en un teléfono el menú es la
 * pantalla — media capa deja el contenido de debajo compitiendo por la atención
 * y encima obliga a resolver el contraste contra lo que haya detrás.
 *
 * Atrapa el foco mientras está abierto y cierra con Escape: sin eso, tabular
 * lleva a enlaces que están tapados por la capa, que es un fallo de teclado que
 * no se ve mirando la pantalla.
 */
export function MenuMovil({
  abierto,
  alCerrar,
  enlaces,
  activo,
}: {
  abierto: boolean;
  alCerrar: () => void;
  enlaces: EnlaceNav[];
  activo: (e: EnlaceNav) => boolean;
}) {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const anteriorFoco = document.activeElement as HTMLElement | null;
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const enfocables = () =>
      Array.from(
        capa.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []
      );
    enfocables()[0]?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        alCerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = desbordeAnterior;
      anteriorFoco?.focus?.();
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      ref={capa}
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      className="fixed inset-0 z-40 flex flex-col justify-between bg-[var(--verde)] px-7 pb-12 pt-28 text-[var(--hueso)] md:hidden"
    >
      <nav>
        <ul className="flex flex-col gap-1">
          {enlaces.map((e) => (
            <li key={e.clave}>
              <Link
                href={e.href}
                onClick={alCerrar}
                aria-current={activo(e) ? "page" : undefined}
                className="block py-2.5 text-[2.5rem] font-extrabold leading-[1.1] tracking-[-0.035em]"
                style={{ color: activo(e) ? "var(--lima)" : undefined }}
              >
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Relojes className="opacity-70" />
    </div>
  );
}
