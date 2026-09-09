"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo en bucle que solo corre cuando está a la vista.
 *
 * Mismo trato que los clips de los servicios: `preload="none"` para que no
 * descargue nada hasta que haga falta, y arranca y para con un
 * IntersectionObserver — un vídeo reproduciéndose fuera de pantalla gasta
 * batería sin que nadie lo vea.
 *
 * Con `prefers-reduced-motion` no se reproduce en absoluto y queda el póster,
 * que es el primer fotograma: la escena se entiende igual quieta.
 */
export function VideoBucle({
  src,
  poster,
  alt,
  className = "",
}: {
  src: string;
  poster: string;
  /** Qué se ve, para quien no puede verlo. */
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setStill(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  return (
    <video
      ref={ref}
      src={still ? undefined : src}
      poster={poster}
      aria-label={alt}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}
