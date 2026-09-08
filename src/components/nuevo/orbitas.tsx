"use client";

import Image from "next/image";
import { ANILLOS } from "@/lib/nuevo/herramientas";
import { EsferaParticulas } from "@/components/nuevo/esfera-particulas";

/**
 * Las herramientas orbitando sobre una semiesfera de partículas.
 *
 * Cada anillo gira en sentido contrario al anterior, y cada insignia
 * contrarrota a la misma velocidad para quedarse derecha — si no, los logos
 * darían vueltas sobre sí mismos y no se leerían.
 *
 * Los anillos se anclan al borde inferior y se bajan media altura, así que
 * solo se ve el arco superior: es lo que hace que parezca un horizonte y no
 * un diagrama de círculos concéntricos.
 *
 * Las animaciones son CSS puro (no GSAP): son giros constantes e infinitos,
 * el caso exacto en que una `@keyframes` gasta menos que un timeline.
 */
export function Orbitas({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex h-[26rem] w-full justify-center overflow-hidden md:h-[34rem] ${className}`}>
      <style>{`
        @keyframes orbita-h { from { transform: rotate(var(--inicio)) } to { transform: rotate(calc(var(--inicio) + 360deg)) } }
        @keyframes orbita-a { from { transform: rotate(var(--inicio)) } to { transform: rotate(calc(var(--inicio) - 360deg)) } }
        @keyframes contra-h { from { transform: rotate(var(--contra)) } to { transform: rotate(calc(var(--contra) - 360deg)) } }
        @keyframes contra-a { from { transform: rotate(var(--contra)) } to { transform: rotate(calc(var(--contra) + 360deg)) } }
        @media (prefers-reduced-motion: reduce) {
          .orbita-brazo, .orbita-insignia { animation: none !important }
        }
      `}</style>

      {/* La esfera, anclada al mismo centro que los anillos */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-square w-64 -translate-x-1/2 translate-y-1/2 md:w-[22rem]">
        <EsferaParticulas />
      </div>

      {ANILLOS.map((anillo, i) => {
        const horario = i % 2 === 0;
        const giro = horario ? "orbita-h" : "orbita-a";
        const contra = horario ? "contra-h" : "contra-a";
        // Tamaños crecientes: 22rem, 30rem, 38rem en móvil; el doble en escritorio.
        const tamano = ["w-[22rem] h-[22rem] md:w-[36rem] md:h-[36rem]", "w-[30rem] h-[30rem] md:w-[46rem] md:h-[46rem]", "w-[38rem] h-[38rem] md:w-[56rem] md:h-[56rem]"][i];

        return (
          <div
            key={i}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-[var(--niebla)]/18 ${tamano}`}
          >
            {anillo.herramientas.map((h, j) => {
              // Repartidas por el arco visible: de -70° a 70° respecto a arriba.
              const angulo = -70 + (140 / (anillo.herramientas.length - 1 || 1)) * j;
              return (
                <div
                  key={h.id}
                  className="orbita-brazo absolute left-1/2 top-0 flex h-1/2 origin-bottom flex-col items-center"
                  style={
                    {
                      "--inicio": `${angulo}deg`,
                      marginLeft: "-1.5rem",
                      animation: `${giro} ${anillo.duracion}s linear infinite`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="orbita-insignia -mt-6 grid h-12 w-12 place-items-center rounded-full bg-[var(--hueso)] shadow-lg ring-1 ring-black/5 md:h-14 md:w-14"
                    style={
                      {
                        "--contra": `${-angulo}deg`,
                        animation: `${contra} ${anillo.duracion}s linear infinite`,
                      } as React.CSSProperties
                    }
                  >
                    <Image
                      src={`/nuevo/logos/${h.id}.svg`}
                      alt={h.nombre}
                      width={28}
                      height={28}
                      className="h-6 w-6 md:h-7 md:w-7"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
