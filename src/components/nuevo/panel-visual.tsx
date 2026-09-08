"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Visual } from "@/lib/nuevo/servicios";
import { ServinomicMini } from "@/components/nuevo/servinomic-mini";
import { WorkflowAnimado } from "@/components/nuevo/workflow-animado";

/**
 * El visual de cada panel de servicio.
 *
 * Los clips son recortes del mismo vídeo del hero, así que la sección entera
 * transcurre en la misma escena y el mismo momento de luz. Van mudos, en
 * bucle y sin controles: son textura, no contenido que alguien vaya a
 * reproducir.
 *
 * Se reproducen SOLO cuando el panel está a la vista. En escritorio los seis
 * paneles existen a la vez dentro del track horizontal, y dejar tres vídeos
 * corriendo fuera de pantalla gasta batería sin que nadie los vea. Con
 * `prefers-reduced-motion` no se reproducen nunca: queda el póster fijo.
 */
export function PanelVisual({ visual, alt }: { visual: Visual; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (still) {
      el.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  if (visual.tipo === "workflow") {
    return <WorkflowAnimado />;
  }

  if (visual.tipo === "productos") {
    return (
      <div className="relative">
        <figure className="w-[86%] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
          <Image
            src={visual.fondo}
            alt={alt}
            width={1100}
            height={745}
            sizes="(min-width: 768px) 36vw, 84vw"
            className="h-auto w-full"
          />
        </figure>
        {/* La recreación se apoya sobre la esquina de la captura: dos productos
            en una sola imagen, sin partir el panel en dos columnas más. */}
        <div className="absolute -bottom-6 right-0 w-[58%]">
          <ServinomicMini />
        </div>
      </div>
    );
  }

  if (visual.tipo === "imagen") {
    return (
      <figure className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
        <Image
          src={visual.src}
          alt={alt}
          width={1100}
          height={773}
          sizes="(min-width: 768px) 40vw, 88vw"
          className="h-auto w-full"
        />
      </figure>
    );
  }

  return (
    <figure className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
      <video
        ref={ref}
        src={visual.src}
        poster={visual.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        className="block h-auto w-full"
      />
    </figure>
  );
}
