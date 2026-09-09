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

/*
 * Toda la geometría va en casillas —el lado de la foto— y se convierte a rem
 * con `var(--casilla)`, que la hoja de estilos ajusta por ancho de pantalla.
 * Así un solo número mueve el conjunto sin descuadrar nada.
 */
/** Separación entre casillas. */
const HUECO = 0.1;
/** Ancho de las columnas laterales. Algo más estrechas que la foto. */
const LADO = 0.9;
/** Alto de los fantasmas laterales. Más altos que la foto para que la retícula no se lea como tabla. */
const ALTO_LADO = 1.4;
/** Desde dónde arranca cada columna lateral. Distinto a cada lado: es lo que la escalona. */
const DESFASE = { izq: -1.05, der: -0.45 };
/**
 * Alto visible. 2.8 casillas enseñan cuatro quintos del fantasma de arriba y
 * del de abajo y ni un píxel de la foto siguiente, que queda detrás de ellos.
 */
const VENTANA = 2.8;

const c = (n: number) => `calc(var(--casilla) * ${n})`;
/** Centro de la foto `k` medido desde el inicio de la columna central. */
const centroDe = (k: number) => (2 * k + 1) * (1 + HUECO) + 0.5;

/**
 * Testimonios como una hoja de contactos.
 *
 * Tres columnas de casillas que se desplazan como una sola pieza. La central
 * alterna fantasma y foto, de modo que entre un testimonio y el siguiente
 * siempre hay una casilla vacía tapando al vecino; las laterales son solo
 * fantasmas, más altos y arrancando a distinta altura para que la retícula
 * tenga cuerpo sin parecer una tabla. Los bordes se difuminan por máscara.
 *
 * El desplazamiento es una transformación con transición CSS y no un scroll
 * real: así la foto activa está siempre donde decimos y no donde dejó la barra
 * el navegador. Con `prefers-reduced-motion` el cambio es instantáneo.
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
  const ancho = 2 * LADO + 2 * HUECO + 1;
  // Fantasmas laterales suficientes para cubrir la ventana en la última foto.
  const fantasmas =
    Math.ceil((centroDe(total - 1) + VENTANA / 2 - DESFASE.izq) / (ALTO_LADO + HUECO)) + 1;

  const columnaLateral = (lado: "izq" | "der") => (
    <div
      aria-hidden="true"
      className={`absolute flex flex-col ${lado === "izq" ? "left-0" : "right-0"}`}
      style={{ top: c(DESFASE[lado]), width: c(LADO), gap: c(HUECO) }}
    >
      {Array.from({ length: fantasmas }, (_, i) => (
        <div key={i} className="reel-fantasma w-full shrink-0" style={{ height: c(ALTO_LADO) }} />
      ))}
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
        className="hoja-contactos relative mx-auto overflow-hidden"
        style={{ width: c(ancho), height: c(VENTANA) }}
      >
        <div
          className="absolute left-0 top-1/2 w-full"
          style={{
            transform: `translateY(${c(-centroDe(activo))})`,
            transition: still ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {columnaLateral("izq")}

          {/* Columna central: fantasma, foto, fantasma, foto… fantasma. */}
          <ul
            className="absolute top-0 flex flex-col"
            style={{ left: c(LADO + HUECO), width: c(1), gap: c(HUECO) }}
          >
            {testimonials.map((t, i) => (
              <li key={t.id} className="contents">
                <div aria-hidden="true" className="reel-fantasma shrink-0" style={{ height: c(1) }} />
                <div
                  className="reel-foto relative shrink-0 overflow-hidden"
                  style={{ height: c(1) }}
                  aria-current={i === activo || undefined}
                >
                  {t.image ? (
                    <Image
                      src={t.image}
                      alt={t.alt ?? t.author}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover grayscale contrast-[1.08]"
                    />
                  ) : (
                    // Monograma mientras no hay foto real: nunca la cara de un
                    // desconocido junto al nombre de una clienta.
                    <span
                      aria-hidden="true"
                      className="grid h-full w-full place-items-center text-4xl font-extrabold text-[var(--verde)]"
                    >
                      {t.author.charAt(0)}
                    </span>
                  )}
                </div>
              </li>
            ))}
            <li aria-hidden="true" className="reel-fantasma shrink-0" style={{ height: c(1) }} />
          </ul>

          {columnaLateral("der")}
        </div>
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
