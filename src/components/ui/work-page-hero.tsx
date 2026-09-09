"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface TimezoneClock {
  tz: string;
  label: string;
}

export interface WorkPageHeroProps {
  /** Vídeo del hero. Acepta archivo directo (.mp4/.webm) o embed en iframe. */
  videoSrc?: string;
  /** Imagen de póster: se ve mientras el vídeo carga y en el primer fotograma. */
  poster?: string;
  videoType?: "auto" | "video" | "iframe";
  /** Velocidad de reproducción. 0.8 = 20 % más lento. */
  playbackRate?: number;
  topWord?: string;
  rightWord?: string;
  bottomWord?: string;
  /** Color de las palabras destacadas y de las horas. */
  accentColor?: string;
  /** Color de la palabra central y de las ciudades. */
  textColor?: string;
  backgroundColor?: string;
  /** Punto que indica que los relojes van en vivo. */
  liveColor?: string;
  showClocks?: boolean;
  clocks?: TimezoneClock[];
  /** Distancia de scroll que dura la expansión del vídeo. */
  scrollDistance?: string;
  className?: string;
}

const DEFAULT_CLOCKS: TimezoneClock[] = [
  { tz: "America/Bogota", label: "CALI" },
  { tz: "Europe/Berlin", label: "FRANKFURT" },
  { tz: "Australia/Sydney", label: "SÍDNEY" },
];

/**
 * Relojes en vivo. Se monta a null y solo empieza a contar en el cliente:
 * si el servidor pintara una hora, React marcaría desajuste de hidratación
 * en el primer segundo.
 */
function useLiveTime() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date());
    // El primer valor se pide en el siguiente fotograma, no en el cuerpo del
    // efecto: así no se encadena un render extra antes de pintar.
    const first = requestAnimationFrame(tick);
    const timer = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(timer);
    };
  }, []);

  const formatTime = (tz: string) => {
    if (!time) return "--:--:--";
    try {
      return new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: tz,
        hour12: false,
      }).format(time);
    } catch {
      return "--:--:--";
    }
  };

  return { formatTime };
}

/**
 * Hero anclado: el vídeo empieza recortado como una píldora y se expande a
 * sangre completa con el scroll, mientras las tres palabras se desvanecen.
 * Con `prefers-reduced-motion` no se ancla nada: el vídeo se muestra ya
 * expandido y las palabras quedan fijas y legibles.
 */
export const WorkPageHero: React.FC<WorkPageHeroProps> = ({
  videoSrc = "/hero/loop.mp4",
  poster = "/hero/poster.jpg",
  videoType = "auto",
  playbackRate = 1,
  topWord = "construimos",
  rightWord = "tu",
  bottomWord = "ventaja",
  accentColor = "#0A3D2E",
  textColor = "#14201B",
  backgroundColor = "#FAFAF7",
  liveColor = "#C8F045",
  showClocks = true,
  clocks = DEFAULT_CLOCKS,
  scrollDistance = "+=150%",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { formatTime } = useLiveTime();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const isDirectVideo =
    videoType === "video" ||
    (videoType === "auto" &&
      !videoSrc.includes("player.cloudinary.com") &&
      !videoSrc.includes("youtube.com") &&
      !videoSrc.includes("vimeo.com") &&
      /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoSrc));

  useGSAP(
    () => {
      if (reduced) return;
      if (!containerRef.current || !videoWrapperRef.current || !textGroupRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: scrollDistance,
          scrub: true,
          pin: true,
        },
      });

      tl.to(
        videoWrapperRef.current,
        { top: "0%", left: "0%", bottom: "0%", right: "0%", borderRadius: "0rem", ease: "none" },
        0
      ).to(
        textGroupRef.current,
        { opacity: 0, scale: 1.15, filter: "blur(12px)", ease: "none" },
        0
      );
    },
    { scope: containerRef, dependencies: [scrollDistance, reduced] }
  );

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-archivo), system-ui, sans-serif",
    fontSize: "clamp(3rem, 10.5vw, 10.5rem)",
    fontWeight: 800,
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ background: backgroundColor }}>
      <section
        ref={containerRef}
        className="relative h-screen min-h-[560px] w-full select-none overflow-hidden"
      >
        {/* ── Tipografía cinética ── */}
        <div
          ref={textGroupRef}
          className="pointer-events-none absolute inset-0 z-30"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {/* Las tres palabras van dentro de un h1: «construimos tu ventaja» ES
              el titular de la página. Eran tres `<span>` sueltos, así que el
              home no tenía ningún h1 — un lector de pantalla no encontraba de
              qué va el sitio y los buscadores tampoco. Los relojes quedan
              fuera: un titular no lleva un reloj dentro. */}
          <h1 className="absolute inset-0 font-normal">
            {/* El 2 % del alto son 18 px en un portátil, y la barra de navegación
                mide 80: la palabra salía cortada por la mitad. `max()` la aparta
                lo justo en pantallas normales y respeta el 2 % en las muy altas,
                donde ese porcentaje ya despeja de sobra. */}
            <div
              className="absolute inset-x-0 flex justify-center"
              style={{ top: "max(2%, calc(var(--alto-barra) + 0.5rem))" }}
            >
              <span
                className="select-none text-center leading-none tracking-tighter"
                style={{
                  ...wordStyle,
                  color: accentColor,
                  // Versales por CSS y no escribiendo «CONSTRUIMOS» en el texto:
                  // así el árbol de accesibilidad conserva «construimos» y los
                  // lectores de pantalla no lo deletrean letra a letra. Solo la
                  // primera palabra — «tu ventaja» sigue en minúscula, que es lo
                  // correcto en español y además da la escalera de tres voces.
                  textTransform: "uppercase",
                }}
              >
                {topWord}
              </span>
            </div>
            {/* Los tres bloques son absolutos, así que en el árbol de
                accesibilidad quedan pegados: sin esto un lector de pantalla
                dice «construimostuventaja» de corrido. El espacio no ocupa
                nada porque el h1 no fija tamaño de letra. */}
            {" "}

            <div className="absolute right-[3%] top-[38%] flex items-center">
              <span
                className="select-none leading-none tracking-tighter"
                style={{ ...wordStyle, color: textColor }}
              >
                {rightWord}
              </span>
            </div>
            {" "}

            <div className="absolute inset-x-0 bottom-[2%] flex justify-center">
              <span
                className="select-none text-center leading-none"
                style={{
                  color: accentColor,
                  fontSize: "clamp(3.6rem, 13vw, 12.5rem)",
                  fontFamily: "var(--font-instrument), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                {bottomWord}
              </span>
              </div>
          </h1>

          {/* Relojes: el punto lima es el único uso del acento en el hero,
              y está ahí porque significa algo — la hora va en vivo. */}
          {showClocks && clocks.length > 0 && (
            <div
              className="absolute left-[clamp(1.25rem,4vw,5rem)] top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:flex"
              style={{
                fontFamily: "var(--font-plex), ui-monospace, monospace",
                fontSize: "clamp(9px,1.05vw,12px)",
                letterSpacing: "0.15em",
              }}
            >
              {clocks.map(({ tz, label }, i) => (
                <div key={tz} className="flex items-center gap-[clamp(0.5rem,1.2vw,1.25rem)]">
                  {i === 0 ? (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: liveColor }}
                    />
                  ) : (
                    <span aria-hidden="true" className="h-1.5 w-1.5 flex-none" />
                  )}
                  <span className="font-medium tabular-nums" style={{ color: accentColor }}>
                    {formatTime(tz)}
                  </span>
                  <span style={{ color: textColor, opacity: 0.75 }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Vídeo que se expande ── */}
        <div
          ref={videoWrapperRef}
          data-static={reduced ? "true" : "false"}
          className="hero-pill absolute z-20 overflow-hidden shadow-2xl"
          style={reduced ? undefined : { willChange: "top, left, right, bottom, border-radius" }}
        >
          {isDirectVideo ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <iframe
              src={videoSrc}
              title="Hero"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="block h-full w-full border-none"
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default WorkPageHero;
