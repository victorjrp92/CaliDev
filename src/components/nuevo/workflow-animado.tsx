"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MEDIDA, NODOS, PROFUNDIDAD, aristas, nivelDe } from "@/lib/nuevo/workflow";

const ARISTAS = aristas();

/** Ningún nodo puede ser lima: el panel donde vive ya lo es. */
const RELLENO: Record<string, string> = {
  verde: "#0A3D2E",
  tinta: "#14201B",
  azul: "#1B3A52",
  hueso: "#FAFAF7",
};

/**
 * El workflow cobrando vida: entra un dato, enciende el primer nodo, la línea
 * se dibuja hacia el siguiente, ese abre dos ramas que corren en paralelo y
 * vuelven a converger en el reporte. En bucle.
 *
 * Es SVG y no vídeo por tres razones: se ve nítido a cualquier tamaño, pesa
 * kilobytes en vez de megas, y sobre todo **reacciona** — al pulsar un nodo la
 * cadena arranca desde ahí, que es lo que un vídeo no puede hacer.
 *
 * Con `prefers-reduced-motion` no se anima: se pinta el grafo entero encendido.
 */
export function WorkflowAnimado({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  const [desde, setDesde] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useGSAP(
    () => {
      const raiz = ref.current;
      if (!raiz || still) return;

      // Nivel desde el que arranca la cadena: 0 en el ciclo normal, o el del
      // nodo que el visitante acaba de pulsar.
      const base = desde ? nivelDe(desde) : 0;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5, defaults: { ease: "power2.out" } });

      // Con pathLength normalizado a 1, el desplazamiento del guion va de 1
      // (línea oculta) a 0 (línea dibujada). No hace falta el plugin DrawSVG.
      tl.set(raiz.querySelectorAll("[data-nodo]"), { opacity: 0.25, scale: 0.92, transformOrigin: "center" });
      tl.set(raiz.querySelectorAll("[data-arista]"), { strokeDashoffset: 1 });

      for (let nivel = base; nivel <= PROFUNDIDAD; nivel++) {
        const t = (nivel - base) * 0.62;
        const lineas = raiz.querySelectorAll(`[data-arista][data-nivel="${nivel}"]`);
        if (lineas.length) tl.to(lineas, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, t);

        const nodos = raiz.querySelectorAll(`[data-nodo][data-nivel="${nivel}"]`);
        if (nodos.length) {
          tl.to(nodos, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)" }, nivel === base ? t : t + 0.4);
        }
      }

      return () => {
        tl.kill();
      };
    },
    { scope: ref, dependencies: [still, desde] }
  );

  return (
    <div ref={ref} className={`w-full ${className}`}>
      <svg
        viewBox="0 0 100 62"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Un flujo automático: entra una reserva, se asigna la persona y se genera el cobro en paralelo, y ambos terminan en el reporte del lunes"
      >
        {/* Aristas primero, para que las formas queden encima */}
        {ARISTAS.map((a) => (
          <path
            key={`${a.de.id}-${a.a.id}`}
            data-arista=""
            data-nivel={a.nivel}
            d={a.d}
            fill="none"
            stroke="#14201B"
            strokeOpacity="0.4"
            strokeWidth="0.6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            style={{ strokeDashoffset: still ? 0 : 1 }}
          />
        ))}

        {NODOS.map((n) => {
          const nivel = nivelDe(n.id);
          const m = MEDIDA[n.forma];
          const redondo = n.forma !== "paso";
          const activo = desde === n.id;

          return (
            <g
              key={n.id}
              data-nodo=""
              data-nivel={nivel}
              style={still ? { opacity: 1 } : undefined}
              className="cursor-pointer"
              onClick={() => setDesde((d) => (d === n.id ? null : n.id))}
            >
              <rect
                x={n.x - m}
                y={n.y - m}
                width={m * 2}
                height={m * 2}
                rx={redondo ? m : 1.8}
                fill={RELLENO[n.tono]}
                stroke="#14201B"
                strokeOpacity={activo ? 0.9 : n.tono === "hueso" ? 0.2 : 0}
                strokeWidth={activo ? 0.7 : 0.3}
              />
              {/* La etiqueta va debajo de la forma: cabe entera y el nodo
                  se lee como figura, no como botón con texto apretado. */}
              <text
                x={n.x}
                y={n.y + m + 4.4}
                textAnchor="middle"
                fill="#14201B"
                style={{
                  fontFamily: "var(--font-plex), ui-monospace, monospace",
                  fontSize: 2.5,
                  letterSpacing: "0.01em",
                }}
              >
                {n.etiqueta.map((linea, i) => (
                  <tspan key={linea} x={n.x} dy={i === 0 ? 0 : 3.1}>
                    {linea}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mono mt-5 text-center opacity-60 max-md:hidden">
        {desde ? "Toca otro nodo para arrancar desde ahí" : "Toca un nodo y la cadena arranca ahí"}
      </p>
    </div>
  );
}
