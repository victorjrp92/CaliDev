"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type ReelTestimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;
  /** Foto del autor. Sin ella se dibuja un monograma con su inicial. */
  image?: string | null;
  alt?: string;
};

/** Alto de cada casilla, en rem. Lo comparten las tres columnas. */
const CASILLA = 7.5;
/** Casillas fantasma por columna lateral. Suficientes para llenar el alto visible. */
const FANTASMA = 6;

/**
 * Testimonios como una hoja de contactos.
 *
 * Tres columnas de casillas: las laterales son fantasmas —solo el borde, sin
 * contenido— escalonadas media casilla para que la retícula no se lea como una
 * tabla; la central es el carrete que se desplaza y donde vive la foto activa.
 * El conjunto da cuerpo a la sección sin competir con la cita.
 *
 * El desplazamiento es una transformación con transición CSS y no un scroll
 * real: así el centro está siempre donde decimos y no depende de dónde haya
 * quedado la barra del navegador. Con `prefers-reduced-motion` el cambio es
 * instantáneo.
 */
export function ScrollReelTestimonials({
  testimonials,
  className = "",
}: {
  testimonials: ReelTestimonial[];
  className?: string;
}) {
  const [activo, setActivo] = useState(0);
  const [still, setStill] = useState(false);
  const total = testimonials.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const mover = useCallback(
    (paso: number) => setActivo((i) => (i + paso + total) % total),
    [total]
  );

  const zona = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = zona.current;
    if (!el) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); mover(-1); }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); mover(1); }
    };
    el.addEventListener("keydown", teclas);
    return () => el.removeEventListener("keydown", teclas);
  }, [mover]);

  const actual = testimonials[activo];
  const transicion = still ? "none" : "transform 620ms cubic-bezier(0.22, 1, 0.36, 1)";

  const columnaFantasma = (desfase: number, key: string) => (
    <div key={key} className="relative overflow-hidden" style={{ width: `${CASILLA}rem` }}>
      <div
        className="absolute left-0 w-full"
        style={{ top: `${-CASILLA * desfase}rem` }}
        aria-hidden="true"
      >
        {Array.from({ length: FANTASMA }, (_, i) => (
          <div key={i} className="p-1.5" style={{ height: `${CASILLA}rem` }}>
            <div className="h-full w-full rounded-2xl border border-current/12 bg-current/4" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={zona}
      tabIndex={0}
      role="group"
      aria-roledescription="carrusel de testimonios"
      aria-label="Lo que dicen nuestros clientes"
      className={`grid items-center gap-10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--lima)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent md:grid-cols-[auto_1fr] md:gap-16 ${className}`}
    >
      {/* Hoja de contactos */}
      <div
        className="relative mx-auto flex h-[24rem] justify-center"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
        }}
      >
        {columnaFantasma(0.55, "izq")}

        {/* Carrete central */}
        <div className="relative overflow-hidden" style={{ width: `${CASILLA}rem` }}>
          <ul
            className="absolute left-0 top-1/2 w-full"
            style={{
              transform: `translateY(calc(-50% - ${(activo - (total - 1) / 2) * CASILLA}rem))`,
              transition: transicion,
            }}
          >
            {testimonials.map((t, i) => {
              const esActivo = i === activo;
              return (
                <li key={t.id} className="p-1.5" style={{ height: `${CASILLA}rem` }}>
                  <button
                    type="button"
                    onClick={() => setActivo(i)}
                    aria-label={`Ver el testimonio de ${t.author}`}
                    aria-current={esActivo}
                    className="block h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-current/12 transition-all duration-500"
                    style={{
                      opacity: esActivo ? 1 : 0.3,
                      transform: esActivo ? "scale(1)" : "scale(0.88)",
                      filter: esActivo ? "none" : "grayscale(1)",
                    }}
                  >
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={t.alt ?? t.author}
                        width={180}
                        height={180}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // Monograma mientras no hay foto real: nunca la cara de
                      // un desconocido junto al nombre de una clienta.
                      <span
                        aria-hidden="true"
                        className="grid h-full w-full place-items-center bg-current/8 text-4xl font-extrabold text-[var(--lima)]"
                      >
                        {t.author.charAt(0)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {columnaFantasma(0.25, "der")}
      </div>

      {/* Cita */}
      <div className="min-w-0">
        <span aria-hidden="true" className="serif block text-6xl leading-none text-[var(--lima)]">
          &ldquo;
        </span>
        <blockquote
          aria-live="polite"
          className="mt-3 max-w-[46ch] text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-[1.28] tracking-[-0.02em]"
        >
          {actual.quote}
        </blockquote>
        <p className="mono mt-6 text-[var(--lima)]">{actual.author}</p>
        {actual.role && <p className="mt-1.5 text-[15px] opacity-65">{actual.role}</p>}

        <div className="mt-9 flex items-center gap-3">
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Testimonio anterior"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-current/25 transition-colors hover:bg-current/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lima)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Testimonio siguiente"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-current/25 transition-colors hover:bg-current/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lima)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <span className="mono ml-2 opacity-50">{activo + 1} / {total}</span>
        </div>
      </div>
    </div>
  );
}

export default ScrollReelTestimonials;
