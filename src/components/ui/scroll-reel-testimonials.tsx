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
/**
 * Cuánto BAJA cada columna lateral por cada paso que la central SUBE.
 *
 * Es contramovimiento: las dos direcciones a la vez hacen que la retícula se
 * lea como dos planos que se cruzan y no como una sola hoja arrastrándose.
 * Menos que el paso de la central (2,2) a propósito — igualarlo daría un efecto
 * de tijera que marea.
 */
const DESLIZ_LADO = 0.85;
/** Desfase inicial de cada lateral. Distinto a cada lado: es lo que escalona la retícula. */
const DESFASE = { izq: -2.15, der: -1.75 };
/**
 * Alto visible. 2.8 casillas enseñan cuatro quintos del fantasma de arriba y
 * del de abajo y ni un píxel de la foto siguiente, que queda detrás de ellos.
 */
const VENTANA = 2.8;
/** Cada cuánto avanza solo. */
const AUTO_MS = 3000;

const c = (n: number) => `calc(var(--casilla) * ${n})`;
/** Centro de la foto `k` medido desde el inicio de la columna central. */
const centroDe = (k: number) => (2 * k + 1) * (1 + HUECO) + 0.5;

/**
 * Testimonios como una hoja de contactos.
 *
 * Tres columnas de casillas. La central alterna fantasma y foto, de modo que
 * entre un testimonio y el siguiente siempre hay una casilla vacía tapando al
 * vecino; las laterales son solo fantasmas, más altos y escalonados.
 *
 * La central sube y las laterales bajan. Ese cruce es lo que da sensación de
 * profundidad: si todo se moviera junto se leería como una sola hoja
 * deslizándose, que es plano.
 *
 * Avanza solo cada tres segundos, y se detiene al pasar el ratón, al recibir
 * el foco de teclado, al salir de la pantalla y con `prefers-reduced-motion`.
 * Un carrusel que sigue girando mientras alguien intenta leerlo o navegarlo con
 * el tabulador es una trampa, no una animación.
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
  const [detenido, setDetenido] = useState(false);
  const [aLaVista, setALaVista] = useState(false);
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

  // Girar fuera de pantalla gasta batería y, peor, hace que quien llegue
  // scrolleando encuentre el carrete por un testimonio cualquiera.
  useEffect(() => {
    const el = zona.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting), {
      threshold: 0.35,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const gira = !still && !detenido && aLaVista && total > 1;

  // `activo` entra en las dependencias a propósito: cada cambio —automático o a
  // mano— reinicia la cuenta, así que tras pulsar una flecha se dispone de los
  // tres segundos completos y no del resto de un ciclo ya empezado.
  useEffect(() => {
    if (!gira) return;
    const t = setTimeout(() => mover(1), AUTO_MS);
    return () => clearTimeout(t);
  }, [gira, activo, mover]);

  const ancho = 2 * LADO + 2 * HUECO + 1;
  const transicion = still ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)";

  // Largo de cada lateral: tiene que tapar la ventana en el paso inicial y
  // seguir tapándola cuando haya bajado todo lo que va a bajar.
  const recorridoLateral = (total - 1) * DESLIZ_LADO;
  const largoLateral = VENTANA - Math.min(DESFASE.izq, DESFASE.der) + recorridoLateral + 1;
  const fantasmas = Math.ceil(largoLateral / (ALTO_LADO + HUECO));

  const columnaLateral = (lado: "izq" | "der") => (
    <div
      key={lado}
      aria-hidden="true"
      className={`absolute top-0 flex flex-col ${lado === "izq" ? "left-0" : "right-0"}`}
      style={{
        width: c(LADO),
        gap: c(HUECO),
        transform: `translateY(${c(DESFASE[lado] + DESLIZ_LADO * activo)})`,
        transition: transicion,
      }}
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
      onMouseEnter={() => setDetenido(true)}
      onMouseLeave={() => setDetenido(false)}
      onFocus={() => setDetenido(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDetenido(false);
      }}
      className={`grid items-center gap-10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--lima)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent md:grid-cols-[auto_1fr] md:gap-16 ${className}`}
    >
      {/* Hoja de contactos */}
      <div
        className="hoja-contactos relative mx-auto overflow-hidden"
        style={{ width: c(ancho), height: c(VENTANA) }}
      >
        {columnaLateral("izq")}

        {/* Columna central: fantasma, foto, fantasma, foto… fantasma. */}
        <ul
          className="absolute top-0 flex flex-col"
          style={{
            left: c(LADO + HUECO),
            width: c(1),
            gap: c(HUECO),
            transform: `translateY(${c(VENTANA / 2 - centroDe(activo))})`,
            transition: transicion,
          }}
        >
          {testimonials.map((t, i) => (
            <li key={t.id} className="contents">
              <div aria-hidden="true" className="reel-fantasma shrink-0" style={{ height: c(1) }} />
              <div
                className="reel-foto duotono relative shrink-0 overflow-hidden"
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

      {/* Cita */}
      <div className="min-w-0">
        <span aria-hidden="true" className="serif block text-6xl leading-none text-[var(--lima)]">
          &ldquo;
        </span>

        {/*
          Las tres citas van APILADAS en la misma celda de la rejilla, con las
          inactivas ocultas por `visibility` —que sigue ocupando sitio— en vez
          de desmontadas. Así el alto del bloque es siempre el de la cita más
          larga y no cambia al rotar.

          Sin esto la sección crecía 122 px al entrar la cita larga y encogía al
          salir, empujando el cierre y el pie arriba y abajo cada tres segundos.
          Reservar el alto a ojo no valía: la cita más larga no es la misma en
          los tres idiomas.
        */}
        <div className="mt-3 grid">
          {testimonials.map((t, i) => {
            const esActivo = i === activo;
            return (
              <div
                key={t.id}
                className="col-start-1 row-start-1"
                style={{ visibility: esActivo ? "visible" : "hidden" }}
                aria-hidden={!esActivo}
              >
                <blockquote
                  // Mientras gira solo, anunciar cada cambio secuestraría el
                  // lector de pantalla cada tres segundos. Solo se anuncia
                  // cuando el cambio lo pidió una persona.
                  aria-live={esActivo && !gira ? "polite" : "off"}
                  className="max-w-[46ch] text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-[1.28] tracking-[-0.02em]"
                >
                  {t.quote}
                </blockquote>
                <p className="mono mt-6 text-[var(--lima)]">{t.author}</p>
                {t.role && <p className="mt-1.5 text-[15px] opacity-65">{t.role}</p>}
              </div>
            );
          })}
        </div>

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
