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
 * En móvil NO se ancla ni se desplaza en horizontal: los paneles se apilan y
 * se leen bajando, como cualquier otra sección.
 *
 * Antes era un carrusel nativo con scroll-snap, y fue un error grave. Un
 * teléfono de 390 px mostraba un panel de seis; los otros cinco vivían a
 * 2340 px a la derecha y solo aparecían si se te ocurría deslizar. Bajando —que
 * es lo que hace todo el mundo— se pasaba del panel de entrada directo a los
 * testimonios, así que los cuatro servicios no se veían NUNCA. La página no
 * llegaba a decir qué se vende a quien entraba desde el móvil, que es casi
 * todo el mundo. El aviso «Desliza →» estaba, en mono pequeño y al 45 % de
 * opacidad; nadie lo leyó.
 *
 * Una tira horizontal dentro de una página que se lee en vertical solo funciona
 * si el gesto está anunciado a gritos y aun así pierde gente. Apilar no pierde
 * a nadie. Lo mismo con `prefers-reduced-motion`.
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
            : // Apilados. `[&>*]:w-full` gana a los `w-screen` de los paneles,
              // que están puestos para el modo anclado: 100vw incluye el ancho
              // de la barra de scroll y desbordaría a lo ancho.
              "flex flex-col [&>*]:w-full"
        }
      >
        {children}
      </div>
    </section>
  );
}

export default HorizontalScroll;
