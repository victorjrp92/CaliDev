"use client";

import { forwardRef } from "react";
import { Link } from "@/i18n/routing";

/**
 * Botón de agenda: un calendario que se abre y enseña lo que hace.
 *
 * Plegado ocupa lo que un icono; al acercarse crece y sale «Agendar una
 * llamada». Un icono solo sería una adivinanza —un calendario podría ser
 * disponibilidad, horarios o un blog—, así que el texto sigue estando en el
 * documento aunque no se vea: se oculta con ancho cero y `overflow`, nunca con
 * `display:none`, para que un lector de pantalla lo siga leyendo entero.
 *
 * Se despliega también con el foco de teclado, no solo con el ratón: si solo
 * respondiera al puntero, quien navegue con el tabulador tendría un botón mudo.
 */
export const BotonAgenda = forwardRef<
  HTMLAnchorElement,
  {
    texto: string;
    className?: string;
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
  }
>(function BotonAgenda({ texto, className = "", onMouseEnter, onFocus }, ref) {
  return (
    <Link
      ref={ref}
      href="/contact"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className={`agenda mono group flex items-center gap-0 whitespace-nowrap ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px] flex-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      <span className="agenda-texto">{texto}</span>
    </Link>
  );
});
