"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * El video de Víctor, dentro del hero. Se reproduce al pulsar: sin autoplay,
 * sin bucle y sin audio automático.
 *
 * Hasta que alguien toca no existe el `<video>`: solo el póster, que pesa
 * decenas de kilobytes. Quien no quiere verlo no descarga el archivo.
 *
 * El botón de play va en el centro, encima de la cara, a propósito: tapar la
 * cara es lo que despierta la curiosidad de verla hablar. Late despacio para
 * invitar a pulsar y desaparece en cuanto empieza el video.
 *
 * El marco es 9:16, el del video: reserva su espacio desde el primer momento
 * para que nada salte al cargar, y no recorta ni estira la imagen. Los
 * subtítulos van quemados en el propio video.
 */
export function VideoIntro() {
  const [activo, setActivo] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-[22px] bg-[#101513] shadow-[0_14px_40px_rgba(20,32,27,0.22)]">
      {activo ? (
        <video
          ref={video}
          src="/servinomic/intro_calidev.mp4"
          poster="/servinomic/intro_calidev-poster.webp"
          controls
          autoPlay
          playsInline
          preload="auto"
          aria-label="Video de Víctor, de CaliDev, 24 segundos"
          className="h-full w-full bg-[#101513] object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivo(true)}
          aria-label="Reproducir el video de Víctor, 24 segundos"
          className="group relative block h-full w-full cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-[var(--lima)]"
        >
          <Image
            src="/servinomic/intro_calidev-poster.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 380px, 100vw"
            className="object-cover"
          />
          {/* Velo oscuro detrás del botón: el blanco se lee sobre cualquier fotograma. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(7,42,32,0.55)_0,rgba(7,42,32,0.18)_45%,rgba(7,42,32,0)_70%)]"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[18px]"
          >
            <span className="delegar-latido relative block h-[124px] w-[124px] rounded-full bg-[#FAFAF7]/96 shadow-[0_10px_34px_rgba(0,0,0,0.35)]">
              <span className="absolute left-[48px] top-[36px] h-0 w-0 border-y-[26px] border-l-[38px] border-y-transparent border-l-[var(--verde)]" />
            </span>
            <span className="rounded-full bg-[#072A20]/80 px-4 py-[9px] text-[15px] font-semibold leading-none text-white">
              Toca para ver
            </span>
          </span>
          <span
            aria-hidden="true"
            className="mono absolute bottom-2.5 right-2.5 rounded-md bg-black/55 px-[7px] py-[3px] text-[11px] text-white"
          >
            0:24
          </span>
        </button>
      )}
    </div>
  );
}
