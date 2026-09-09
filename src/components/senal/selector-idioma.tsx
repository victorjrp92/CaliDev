"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

const IDIOMAS = [
  { codigo: "es", etiqueta: "ES", nombre: "Español" },
  { codigo: "en", etiqueta: "EN", nombre: "English" },
  { codigo: "de", etiqueta: "DE", nombre: "Deutsch" },
];

/**
 * Selector de idioma plegado.
 *
 * Tres códigos en fila ocupaban tanto como dos enlaces de navegación para algo
 * que casi nadie toca. Plegado enseña solo el idioma activo; al abrirlo salen
 * los otros dos con su nombre completo, que es más útil que «DE» a secas para
 * quien busca su idioma.
 *
 * Cierra al pulsar fuera y con Escape, y devuelve el foco al disparador: sin
 * eso, tabular después de cerrarlo salta al principio de la página.
 */
export function SelectorIdioma({
  onMouseEnter,
  onFocus,
}: {
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
}) {
  const idioma = useLocale();
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setAbierto(false);
      disparador.current?.focus();
    };

    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", teclas);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", teclas);
    };
  }, [abierto]);

  const actual = IDIOMAS.find((l) => l.codigo === idioma) ?? IDIOMAS[0];
  const otros = IDIOMAS.filter((l) => l.codigo !== idioma);

  return (
    <div ref={caja} className="relative">
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label={`Idioma: ${actual.nombre}. Cambiar idioma`}
        className="mono flex cursor-pointer items-center gap-1.5 px-1.5 py-1 opacity-88 transition-opacity hover:opacity-100"
      >
        {actual.etiqueta}
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="h-2.5 w-2.5 transition-transform duration-200"
          style={{ transform: abierto ? "rotate(180deg)" : undefined }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {abierto && (
        <ul
          role="listbox"
          aria-label="Idiomas"
          className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[9rem] overflow-hidden rounded-xl border border-[var(--linea)] bg-[var(--verde)] py-1.5 shadow-2xl"
        >
          {otros.map((l) => (
            <li key={l.codigo} role="option" aria-selected="false">
              <Link
                href={ruta}
                locale={l.codigo}
                onClick={() => setAbierto(false)}
                className="mono flex items-center gap-3 px-4 py-2.5 text-[var(--hueso)] transition-colors hover:bg-[var(--hueso)]/10"
              >
                <span className="opacity-55">{l.etiqueta}</span>
                <span className="normal-case tracking-normal">{l.nombre}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
