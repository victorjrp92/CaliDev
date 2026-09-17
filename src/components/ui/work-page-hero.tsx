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
  /**
   * La línea que dice de qué va esto. Va debajo de la primera palabra porque el
   * eslogan cinético es memorable pero no explica nada: sin ella, sobre el
   * pliegue de un móvil solo se leen tres palabras abstractas.
   */
  tagline?: string;
  /** Texto y destino de la llamada a la acción del hero. */
  ctaTexto?: string;
  ctaHref?: string;
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
  tagline,
  ctaTexto,
  ctaHref = "#servicios",
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
  /**
   * La línea explicativa y el botón viven en su propio grupo, no en el de las
   * palabras: aquel lleva `pointer-events: none` para no robarle el ratón al
   * vídeo, y dentro de él un enlace sería imposible de pulsar. Se desvanecen
   * con la misma línea de tiempo para salir de escena a la vez.
   */
  const infoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { formatTime } = useLiveTime();
  const [reduced, setReduced] = useState(false);
  /**
   * Proporción real del vídeo, leída de sus metadatos. En móvil la píldora saca
   * su altura de aquí —ver `.hero-pill` en senal.css— para no recortar. 16/9
   * es solo el valor con el que se pinta el primer fotograma; en cuanto el
   * navegador conoce el archivo se corrige.
   */
  const [relVideo, setRelVideo] = useState(16 / 9);

  /**
   * `true` a partir de 768 px, `null` hasta que se sabe. Arranca sin valor a
   * propósito: si empieza en `true` se crea la línea de tiempo de escritorio,
   * el efecto la corrige a móvil y se rehace, y los dos anclajes se suman —el
   * relleno salía de 1461 px, que es 996 de escritorio más 465 de móvil, y el
   * hero se iba mil píxeles hacia abajo. Sin valor no se crea ninguna hasta
   * saber cuál toca.
   */
  const [ancho, setAncho] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const anchoMq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setReduced(mq.matches);
      setAncho(anchoMq.matches);
    };
    update();
    mq.addEventListener("change", update);
    anchoMq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      anchoMq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  /**
   * La proporción también se lee aquí y no solo en `onLoadedMetadata`: el
   * navegador puede tener los metadatos antes de que React enganche el
   * manejador, y entonces el evento ya pasó y la píldora se queda con el 16/9
   * de reserva en vez de con la del archivo.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1 && v.videoWidth && v.videoHeight) {
      setRelVideo(v.videoWidth / v.videoHeight);
    }
  }, [videoSrc]);

  /**
   * Medidas del hero en móvil. La píldora arranca justo debajo del bloque de
   * texto y «tu» justo debajo de la píldora, las dos calculadas sobre lo que
   * el bloque ocupa de verdad —que cambia con el idioma y con el ancho— en vez
   * de sobre porcentajes del alto de pantalla, que es lo que hacía que el botón
   * acabara encima del vídeo en los móviles bajos.
   *
   * `offsetTop`/`offsetHeight` y no `getBoundingClientRect`: GSAP escala el
   * bloque mientras se desvanece, y el rectángulo incluiría esa escala.
   */
  /**
   * Dónde empieza la píldora en móvil, en píxeles. `null` mientras no se ha
   * medido o cuando la pantalla es ancha, y entonces manda el CSS.
   */
  const [pildoraArriba, setPildoraArriba] = useState<number | null>(null);
  const [anchoSeccion, setAnchoSeccion] = useState(0);

  useEffect(() => {
    const seccion = containerRef.current;
    if (!seccion) return;

    const medir = () => {
      const ancho = seccion.offsetWidth;
      if (ancho >= 768) return setPildoraArriba(null);
      const info = infoRef.current;
      const arriba = info ? info.offsetTop + info.offsetHeight + 24 : seccion.offsetHeight * 0.36;
      setPildoraArriba(Math.round(arriba));
      setAnchoSeccion(ancho);
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(seccion);
    if (infoRef.current) ro.observe(infoRef.current);
    return () => ro.disconnect();
  }, [tagline, ctaTexto]);

  const medidas: React.CSSProperties =
    pildoraArriba == null
      ? {}
      : ({
          "--pildora-arriba": `${pildoraArriba}px`,
          // La píldora ocupa el 90 % del ancho (left y right al 5 %) y su alto
          // sale de la proporción del vídeo. «tu» va justo debajo.
          "--tu-arriba": `${Math.round(pildoraArriba + (anchoSeccion * 0.9) / relVideo + 20)}px`,
        } as React.CSSProperties);

  const isDirectVideo =
    videoType === "video" ||
    (videoType === "auto" &&
      !videoSrc.includes("player.cloudinary.com") &&
      !videoSrc.includes("youtube.com") &&
      !videoSrc.includes("vimeo.com") &&
      /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoSrc));

  useGSAP(
    () => {
      if (reduced || ancho === null) return;
      if (!containerRef.current || !videoWrapperRef.current || !textGroupRef.current) return;

      const seccion = containerRef.current;
      const pildora = videoWrapperRef.current;
      const textos = [textGroupRef.current, infoRef.current].filter(Boolean);

      /**
       * Se elige el recorrido con el estado de la media query, no con
       * `gsap.matchMedia()`. Aquella registraba su rama dos veces —React monta,
       * desmonta y vuelve a montar los efectos en desarrollo, y el contexto no
       * la revertía— y el anclaje acababa con el doble de recorrido: 930 px de
       * relleno donde tocaban 465, con el hero arrancando 465 px más abajo de
       * la pantalla. El resto del archivo ya resuelve así `prefers-reduced-motion`.
       */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: seccion,
          start: "top top",
          // En móvil el recorrido es más corto: con 150 % había que bajar
          // pantalla y media para ver crecer la píldora, y todo ese scroll iba
          // antes de la primera frase que dice qué vendemos.
          end: ancho ? scrollDistance : "+=70%",
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      /**
       * En móvil se anima SOLO el ancho. Ni `top` ni `bottom`.
       *
       * `bottom` porque la altura la fija `aspect-ratio`, y animarlo devolvería
       * la caja vertical que recortaba el vídeo a un tercio.
       *
       * `top` porque la posición la decide una medida del bloque de texto,
       * escrita en `--pildora-arriba`. GSAP graba el punto de partida al crear
       * la línea de tiempo y lo escribe en línea, donde gana a la variable; con
       * la medida llegando después, los dos se peleaban por la misma propiedad
       * y ganaba el valor viejo. Repartidas, cada uno manda en lo suyo.
       */
      const destino = ancho
        ? { top: "0%", left: "0%", bottom: "0%", right: "0%", borderRadius: "0rem", ease: "none" }
        : { left: "0%", right: "0%", borderRadius: "0rem", ease: "none" };

      tl.to(pildora, destino, 0).to(
        textos,
        { opacity: 0, scale: 1.15, filter: "blur(12px)", ease: "none" },
        0
      );

      // Al rehacer la línea de tiempo hay que deshacer el anclaje anterior a
      // mano. Si solo se revierte el contexto, el espaciador se queda y su
      // relleno se suma al del nuevo.
      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === seccion) st.kill(true);
        });
      };
    },
    /**
     * `revertOnUpdate: true` es obligatorio, no una preferencia.
     *
     * Sin él, `useGSAP` calcula `deferCleanup = dependencies.length &&
     * !revertOnUpdate` y, cuando sale verdadero, solo revierte el contexto al
     * DESMONTAR: entre cambios de dependencia no revierte nada y la función de
     * limpieza de aquí arriba no llega a ejecutarse nunca. Es decir, el arreglo
     * que describe ese comentario era código muerto.
     *
     * Lo que provocaba: el hero se construía dos veces sin matar el primer
     * anclaje, los dos espaciadores sumaban su relleno —1317 px cada uno, 2634
     * en total— y la sección quedaba fija 1317 px por debajo del borde de la
     * pantalla. Resultado visible: se entraba al inicio y el hero no estaba;
     * aparecía al bajar y volver a subir, porque eso fuerza a ScrollTrigger a
     * medir otra vez. Se reproducía en CUALQUIER navegación de cliente al home
     * —cambiar de idioma, pulsar INICIO desde otra página—, nunca en una carga
     * directa.
     *
     * `relVideo` fuera de la lista: la línea de tiempo no lo usa. La proporción
     * del vídeo solo alimenta la variable CSS `--tu-arriba`, que es CSS puro.
     * Estando en la lista, el orden en que llegan los metadatos del vídeo y la
     * media query decidía si la línea de tiempo se construía una vez o dos —una
     * carrera que la carga directa ganaba y la navegación de cliente perdía,
     * porque ahí el vídeo ya está en caché y responde un tic más tarde que la
     * medida del ancho—.
     *
     * `pildoraArriba` tampoco entra: rehacer la línea de tiempo al medir dejaba
     * el espaciador descuadrado y el hero arrancaba 465 px más abajo. Como en
     * móvil la animación ya no toca `top`, la medida entra sola por la variable
     * CSS y no hay que rehacer nada.
     */
    {
      scope: containerRef,
      revertOnUpdate: true,
      dependencies: [scrollDistance, reduced, ancho],
    }
  );

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-archivo), system-ui, sans-serif",
    /**
     * El suelo del tamaño también tiene que depender del ancho. Con 3rem fijos,
     * «construimos» medía 357 px en una pantalla de 320 y se salía: el móvil
     * respondía encogiendo la página entera, así que todo se veía alejado y con
     * la maqueta descuadrada. En inglés no pasaba —«we build» es más corto— y
     * por eso solo se notaba en español.
     *
     * `min(3rem, 12.5vw)` deja el tamaño intacto de 384 px para arriba, que es
     * donde ya cabía, y lo baja solo en las pantallas donde no.
     */
    fontSize: "clamp(min(3rem, 12.5vw), 10.5vw, 10.5rem)",
    fontWeight: 800,
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ background: backgroundColor }}>
      <section
        ref={containerRef}
        className="relative h-screen min-h-[560px] w-full select-none overflow-hidden"
        style={medidas}
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

            {/* La posición vertical vive en `.hero-tu` (senal.css): en móvil
                sale de la medida real de la píldora, no de un porcentaje. */}
            <div className="hero-tu absolute right-[3%] flex items-center">
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

        {/* Línea explicativa y llamada a la acción. Fuera del grupo de las
            palabras porque aquel no recibe eventos de puntero —para no robarle
            el ratón al vídeo— y dentro de él un enlace sería imposible de
            pulsar. `top` los coloca bajo la primera palabra: su tamaño es
            proporcional al ancho, así que el hueco también tiene que serlo. */}
        {(tagline || ctaTexto) && (
          <div
            ref={infoRef}
            className={
              // En móvil, centrado bajo la primera palabra: ahí hay hueco entre
              // la palabra y el vídeo. En escritorio no lo hay —la píldora
              // ocupa el centro desde el 18 %— así que se va a la franja
              // izquierda, el único espacio libre, sobre los relojes.
              "absolute z-30 flex flex-col items-center gap-4 px-6 text-center " +
              "top-[var(--info-arriba)] inset-x-0 " +
              "md:inset-x-auto md:left-[clamp(1.25rem,4vw,5rem)] md:top-[24%] " +
              "md:max-w-[calc(22vw-clamp(1.25rem,4vw,5rem)-2rem)] md:items-start md:gap-5 md:px-0 md:text-left"
            }
            style={
              {
                "--info-arriba":
                  "calc(max(2%, calc(var(--alto-barra) + 0.5rem)) + clamp(3.2rem, 11vw, 11rem))",
                willChange: "transform, opacity, filter",
              } as React.CSSProperties
            }
          >
            {/* En texto normal y no en el mono versal del resto de etiquetas:
                una frase de cien caracteres en versales espaciadas ocupa cuatro
                líneas y se lee peor — el mono está para rótulos cortos. */}
            {tagline && (
              <p
                className="max-w-[36ch] text-[15px] leading-[1.45] md:max-w-none md:text-[17px] md:leading-[1.5]"
                style={{ color: accentColor, opacity: 0.8 }}
              >
                {tagline}
              </p>
            )}
            {ctaTexto && (
              <a
                href={ctaHref}
                className="mono inline-flex items-center gap-2 rounded-full px-6 py-3 transition-[filter] hover:brightness-95"
                style={{ background: liveColor, color: textColor }}
              >
                {ctaTexto}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        )}

        {/* ── Vídeo que se expande ── */}
        <div
          ref={videoWrapperRef}
          data-static={reduced ? "true" : "false"}
          className="hero-pill absolute z-20 overflow-hidden shadow-2xl"
          style={
            {
              "--rel-video": relVideo,
              ...(reduced ? {} : { willChange: "top, left, right, bottom, border-radius" }),
            } as React.CSSProperties
          }
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
              // La proporción se lee del archivo, no se declara a mano: si
              // mañana se cambia el vídeo por uno vertical, la píldora se
              // adapta sola en vez de recortarlo.
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setRelVideo(v.videoWidth / v.videoHeight);
              }}
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
