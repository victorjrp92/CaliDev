"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Un clip mudo en bucle, tratado como si los datos costaran dinero — porque
 * cuestan.
 *
 * Esta página la abre casi todo el mundo desde el móvil y con datos, así que
 * cada vídeo respeta las mismas cuatro reglas:
 *
 *  · `preload="none"` — quien rebota antes de llegar a este punto de la página
 *    no descarga un solo byte de vídeo. Lo que ve mientras tanto es el póster,
 *    que pesa decenas de kilobytes en vez de cientos.
 *  · Solo se reproduce cuando está a la vista. En segundo plano gasta batería
 *    sin que nadie lo mire.
 *  · `playsInline` es obligatorio: sin él, iOS lo abre a pantalla completa en
 *    cuanto empieza y se lleva a la visitante fuera de la página.
 *  · Con `prefers-reduced-motion` no se reproduce nunca: queda el póster fijo.
 *
 * Vive aparte y no dentro de cada sección porque esas cuatro reglas se aplican
 * a todos los clips de la página por igual, y una copiada es una que se queda
 * sin arreglar el día que se descubra la quinta.
 *
 * `descripcion` es obligatoria y va al `aria-label`: un vídeo mudo sin texto
 * alternativo no existe para quien no ve la pantalla.
 *
 * Envuelve en un `div` y no en un `figure` a propósito: quien necesite pie de
 * foto pone su propio `figure` alrededor, y así no salen figuras anidadas —una
 * dentro de otra, la de dentro sin pie— que es lo que pasaba antes.
 */
export function Clip({
  src,
  poster,
  descripcion,
  className = "",
}: {
  src: string;
  poster: string;
  descripcion: string;
  /** Clases del `figure`, para el redondeo o el borde que pida cada sitio. */
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ver = () => setQuieto(mq.matches);
    ver();
    mq.addEventListener("change", ver);
    return () => mq.removeEventListener("change", ver);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (quieto) {
      el.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [quieto]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={descripcion}
        className="aspect-video w-full object-cover"
      />
    </div>
  );
}
