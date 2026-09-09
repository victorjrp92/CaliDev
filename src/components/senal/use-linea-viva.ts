"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * El filete lima que sigue al puntero por la barra.
 *
 * Su casa es el botón de agenda —es el único elemento de la barra que siempre
 * quiere que lo pulses— y se desplaza a lo que estés señalando. Es un solo
 * elemento que se mueve, no un borde por enlace: así el recorrido se ve, y ver
 * de dónde viene y a dónde va es justo lo que lo hace útil en vez de decorativo.
 *
 * Mide con `getBoundingClientRect` en el momento de apuntar, no al montar,
 * porque el botón de agenda cambia de ancho al desplegarse y una medida guardada
 * dejaría el filete corto justo debajo de él.
 */
export function useLineaViva() {
  const zona = useRef<HTMLDivElement>(null);
  const casa = useRef<HTMLAnchorElement>(null);
  const [tramo, setTramo] = useState<{ x: number; ancho: number } | null>(null);
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  const apuntar = useCallback((destino: HTMLElement | null) => {
    const marco = zona.current;
    if (!marco || !destino) return;
    const m = marco.getBoundingClientRect();
    const d = destino.getBoundingClientRect();
    setTramo({ x: d.left - m.left, ancho: d.width });
  }, []);

  const volverACasa = useCallback(() => apuntar(casa.current), [apuntar]);

  // Colocarlo al montar y cada vez que la barra cambie de tamaño: el filete
  // vive en coordenadas absolutas y una ventana más estrecha lo dejaría
  // apuntando al vacío.
  useEffect(() => {
    const marco = zona.current;
    if (!marco) return;
    const fotograma = requestAnimationFrame(volverACasa);
    const observador = new ResizeObserver(volverACasa);
    observador.observe(marco);
    return () => {
      cancelAnimationFrame(fotograma);
      observador.disconnect();
    };
  }, [volverACasa]);

  /** Props para cada elemento que el filete puede seguir. */
  const seguible = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => apuntar(e.currentTarget),
    onFocus: (e: React.FocusEvent<HTMLElement>) => apuntar(e.currentTarget),
  };

  return { zona, casa, tramo, quieto, seguible, volverACasa };
}
