"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El clip del hero: un servicio de limpieza, en bucle y mudo.
 *
 * Esta página la abre casi todo el mundo desde el móvil y con datos, así que el
 * vídeo se trata como si costara dinero, porque cuesta:
 *
 *  · `preload="none"` — quien rebota antes de llegar aquí no descarga un solo
 *    byte de vídeo. Lo que ve mientras tanto es el póster, de 58 KB.
 *  · Solo se reproduce cuando está a la vista. En segundo plano gasta batería
 *    sin que nadie lo mire.
 *  · `playsInline` es obligatorio: sin él, iOS lo abre a pantalla completa en
 *    cuanto empieza y se lleva a la visitante fuera de la página.
 *
 * Con `prefers-reduced-motion` no se reproduce nunca: queda el póster fijo.
 *
 * NOTA: la escena es una recreación, no la grabación de un servicio real. Por
 * eso no lleva pie de foto que la presente como documental. Los datos ciertos
 * del equipo —cuántas son y en cuántas ciudades— viven en la ficha de Deisy,
 * justo debajo.
 */
export function ClipHero() {
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
    <figure className="overflow-hidden rounded-3xl">
      <video
        ref={ref}
        src="/servinomic/limpieza.mp4"
        poster="/servinomic/limpieza-poster.webp"
        muted
        loop
        playsInline
        preload="none"
        aria-label="Tres personas del equipo de limpieza trabajando en una casa: una limpia un ventanal, otra trapea el piso y otra la cocina"
        className="aspect-video w-full object-cover"
      />
    </figure>
  );
}
