"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface HorizontalScrollProps {
  /** Ancla de la sección. Sin `scroll-margin`: el pin arranca en `top top`, así
      que el borde superior ya es el sitio correcto al que saltar. */
  id?: string;
  /** Cada hijo es un panel a pantalla completa. */
  children: React.ReactNode;
  /** Suavizado del scrub. Más alto = el desplazamiento persigue al scroll con más retardo. */
  scrub?: number;
  className?: string;
}

/**
 * Sección anclada que convierte el scroll vertical en desplazamiento
 * horizontal de sus paneles.
 *
 * En móvil NO se ancla: se degrada a un carrusel nativo con scroll-snap. El
 * anclaje horizontal en táctil pelea con el impulso del navegador y rompe la
 * restauración de posición al volver atrás; el snap nativo es lo que la gente
 * espera en un teléfono. Lo mismo con `prefers-reduced-motion`.
 */
export function HorizontalScroll({ children, id, scrub = 1, className = "" }: HorizontalScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPinned(wide.matches && !still.matches);
    update();
    wide.addEventListener("change", update);
    still.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      still.removeEventListener("change", update);
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!pinned || !section || !track) return;

      // La distancia a recorrer se mide del propio track, así el pin dura
      // exactamente lo que falta por mostrar y no un porcentaje inventado.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    },
    { scope: sectionRef, dependencies: [pinned, scrub] }
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative ${pinned ? "h-screen overflow-hidden" : ""} ${className}`}
    >
      <div
        ref={trackRef}
        className={
          pinned
            ? "flex h-screen flex-nowrap will-change-transform"
            : "flex snap-x snap-mandatory flex-nowrap overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {children}
      </div>
    </section>
  );
}

export default HorizontalScroll;
