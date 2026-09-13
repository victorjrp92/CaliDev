"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ENLACES,
  EXTRAS,
  LIENZO,
  PASOS,
  TARJETA,
  alcanzables,
  curva,
  type Extra,
} from "@/lib/nuevo/workflow";

/**
 * Iconos en línea y no de una librería: son diez glifos de 16 px y traerse un
 * paquete entero por ellos añade kilobytes a una página que ya costó bajar de
 * 2.103 a 597 KB.
 */
const ICONO: Record<string, string> = {
  calendario:
    '<path d="M3 4h10v9H3z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 7h10M6 2v3M10 2v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  persona:
    '<circle cx="8" cy="5.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.2 13.4c0-2.6 2.1-4.2 4.8-4.2s4.8 1.6 4.8 4.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  ruta:
    '<circle cx="4" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="4" r="1.8" fill="currentColor"/><path d="M4 10.2C4 6 8 9 8 5.6c0-1 1.4-1.6 4-1.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2.4 2.2"/>',
  recibo:
    '<path d="M4 2h8v12l-2-1.2-2 1.2-2-1.2L4 14z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.4 6h3.2M6.4 9h3.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  monedas:
    '<ellipse cx="8" cy="4.6" rx="4.6" ry="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.4 4.6v6.8c0 1.1 2.1 2 4.6 2s4.6-.9 4.6-2V4.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.4 8c0 1.1 2.1 2 4.6 2s4.6-.9 4.6-2" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  barras:
    '<path d="M2.6 13.4h10.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="3.6" y="8" width="2.4" height="4" fill="currentColor"/><rect x="7" y="5" width="2.4" height="7" fill="currentColor"/><rect x="10.4" y="9.6" width="2.4" height="2.4" fill="currentColor"/>',
  mensaje:
    '<path d="M2.6 3.4h10.8v7.2H8l-3.4 2.6v-2.6H2.6z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.2 6.6h5.6M5.2 8.6h3.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  tarjeta:
    '<rect x="2.4" y="4" width="11.2" height="8" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2.4 6.8h11.2" stroke="currentColor" stroke-width="1.4"/><path d="M4.8 9.8h2.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
};

/**
 * Por debajo de este ancho el grafo se apila. No es solo por el móvil: entre
 * 768 y 1280 la columna del visual se queda en poco más de 300 px, y escalar
 * ahí deja las tarjetas con la letra a seis píxeles.
 */
const ANCHO_GRAFO = "(min-width: 1280px)";

/** Lo que ocupa el panel además del lienzo: su margen, el botón y la pista. */
const MARGEN_VERTICAL = 246;
/** Un punto por debajo de lo que cabe: el diagrama respira mejor con aire. */
const MENGUA = 0.95;

type Tarjeta = Extra;

function Icono({ nombre }: { nombre: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONO[nombre] ?? "" }} />
  );
}

/**
 * El flujo como tarjetas que se agarran con el ratón: al mover una, las líneas
 * la siguen, y al soltarla la cadena se enciende desde ahí hacia adelante. El
 * botón añade dos pasos más, cada uno enganchado donde tiene sentido.
 *
 * No va dentro de un recuadro con scroll propio a propósito. Un lienzo con sus
 * barras dentro de una sección que ya avanza con el scroll pelea por el mismo
 * gesto en un trackpad, y esconde lo que no cabe. Aquí las tarjetas tienen tope
 * y no se pueden sacar de su zona, así que no hay nada fuera que alcanzar y no
 * aparece ninguna barra.
 *
 * Con `prefers-reduced-motion` y en pantallas estrechas se apila: la misma
 * cadena, una tarjeta debajo de otra, sin gestos laterales.
 */
export function WorkflowAnimado({ className = "" }: { className?: string }) {
  const t = useTranslations("senal.flujo");
  const zonaRef = useRef<HTMLDivElement>(null);
  const marcoRef = useRef<HTMLDivElement>(null);

  const [tarjetas, setTarjetas] = useState<Tarjeta[]>(() => PASOS.map((p) => ({ ...p })));
  const [enlaces, setEnlaces] = useState<[string, string][]>(() => ENLACES.map((e) => [...e]));
  const [pendientes, setPendientes] = useState<Extra[]>(() => EXTRAS.map((e) => ({ ...e })));
  const [encendido, setEncendido] = useState<Set<string> | null>(null);
  const [escala, setEscala] = useState(1);
  /** `null` hasta saberlo: sin esto se monta el grafo y se reemplaza al instante. */
  const [grafo, setGrafo] = useState<boolean | null>(null);
  /**
   * Las luces solo corren cuando el panel se ve. En escritorio los seis paneles
   * existen a la vez dentro del track horizontal, y dejar animaciones corriendo
   * fuera de pantalla gasta batería sin que nadie las vea.
   */
  const [aLaVista, setALaVista] = useState(false);

  /**
   * Alto real de cada tarjeta, en estado y no en un ref: el compilador de React
   * prohíbe leer refs durante el render, y aquí hay que leerlos justo ahí para
   * trazar las curvas. En alemán los títulos ocupan una línea más y las
   * tarjetas crecen, así que suponer un alto fijo descuadra las líneas.
   */
  const [altos, setAltos] = useState<Record<string, number>>({});

  useEffect(() => {
    const ancho = window.matchMedia(ANCHO_GRAFO);
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ver = () => setGrafo(ancho.matches && !quieto.matches);
    ver();
    ancho.addEventListener("change", ver);
    quieto.addEventListener("change", ver);
    return () => {
      ancho.removeEventListener("change", ver);
      quieto.removeEventListener("change", ver);
    };
  }, []);

  /**
   * El lienzo es fijo y se escala a lo que haya, para que las posiciones
   * declaradas en `workflow.ts` signifiquen lo mismo en cualquier pantalla.
   *
   * Manda el ancho O el alto, el que apriete más. Escalando solo por ancho, en
   * una ventana de 796 px el visual medía 715 donde caben 636: se comía el
   * margen del panel y el botón acababa pegado a la barra de navegación, que va
   * fija y se lo tapaba.
   */
  useEffect(() => {
    const marco = marcoRef.current;
    if (!marco || !grafo) return;
    const medir = () => {
      const porAncho = marco.clientWidth / LIENZO.ancho;
      // El alto del panel menos su margen, el botón de arriba y la pista de abajo.
      const porAlto = (window.innerHeight - MARGEN_VERTICAL) / LIENZO.alto;
      setEscala(Math.max(0.6, Math.min(1.15, porAncho, porAlto) * MENGUA));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(marco);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [grafo]);

  useEffect(() => {
    const zona = zonaRef.current;
    if (!zona) return;
    const io = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting), { threshold: 0.15 });
    io.observe(zona);
    return () => io.disconnect();
  }, [grafo]);

  const altoDe = (id: string) => altos[id] ?? TARJETA.alto;

  // Se corta sola cuando la medida no cambia, así que no entra en bucle aunque
  // React vuelva a enganchar el ref en cada render.
  const medirTarjeta = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) return;
      const alto = el.offsetHeight;
      setAltos((prev) => (prev[id] === alto ? prev : { ...prev, [id]: alto }));
    },
    []
  );

  const anadir = () => {
    const [siguiente, ...resto] = pendientes;
    if (!siguiente) return;
    setTarjetas((prev) => [...prev, siguiente]);
    setEnlaces((prev) => [
      ...prev,
      ...(siguiente.de ? ([[siguiente.de, siguiente.id]] as [string, string][]) : []),
      ...(siguiente.a ? ([[siguiente.id, siguiente.a]] as [string, string][]) : []),
    ]);
    setPendientes(resto);
    setEncendido(null);
  };

  // ── Arrastre. Con tope: ninguna tarjeta puede salirse del lienzo. ──
  const arrastre = useRef<{ id: string; x: number; y: number; ox: number; oy: number } | null>(null);

  const alBajar = (id: string) => (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!grafo) return;
    ev.preventDefault();
    const tarjeta = tarjetas.find((c) => c.id === id);
    if (!tarjeta) return;
    arrastre.current = { id, x: ev.clientX, y: ev.clientY, ox: tarjeta.x, oy: tarjeta.y };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const alMover = (id: string) => (ev: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== id) return;
    const maxX = LIENZO.ancho - TARJETA.ancho;
    const maxY = LIENZO.alto - altoDe(id);
    const x = Math.min(maxX, Math.max(0, a.ox + (ev.clientX - a.x) / escala));
    const y = Math.min(maxY, Math.max(0, a.oy + (ev.clientY - a.y) / escala));
    setTarjetas((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const alSoltar = (id: string) => () => {
    if (arrastre.current?.id !== id) return;
    arrastre.current = null;
    setEncendido(alcanzables(id, enlaces));
  };

  // La cadena encendida se apaga sola: es un destello que explica, no un estado.
  useEffect(() => {
    if (!encendido) return;
    const reloj = setTimeout(() => setEncendido(null), 2400);
    return () => clearTimeout(reloj);
  }, [encendido]);

  const alTeclado = (id: string) => (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const paso = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[
      ev.key
    ];
    if (!paso) return;
    ev.preventDefault();
    const f = ev.shiftKey ? 3 : 1;
    const maxX = LIENZO.ancho - TARJETA.ancho;
    const maxY = LIENZO.alto - altoDe(id);
    setTarjetas((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              x: Math.min(maxX, Math.max(0, c.x + paso[0] * f)),
              y: Math.min(maxY, Math.max(0, c.y + paso[1] * f)),
            }
          : c
      )
    );
    setEncendido(alcanzables(id, enlaces));
  };

  const cuerpo = (c: Tarjeta) => (
    <>
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 flex-none place-items-center rounded-lg text-[var(--hueso)]"
          style={{ background: c.acento }}
        >
          <Icono nombre={c.icono} />
        </span>
        <span className="mono text-[8.5px] tracking-[0.16em] opacity-55">
          {t(`tipos.${c.tipo}`)}
        </span>
      </div>
      <p className="mt-[7px] text-[13px] font-semibold leading-[1.25] tracking-[-0.01em]">
        {t(`pasos.${c.id}.titulo`)}
      </p>
      <p className="mt-[5px] text-[11px] leading-[1.45] opacity-60">{t(`pasos.${c.id}.pie`)}</p>
    </>
  );

  const boton = (
    <button
      type="button"
      onClick={anadir}
      disabled={!pendientes.length}
      className="mono inline-flex items-center gap-2 rounded-full border border-[var(--verde)]/45 px-4 py-2 text-[11px] tracking-[0.16em] text-[var(--verde)] transition-colors hover:bg-[var(--verde)] hover:text-[var(--hueso)] disabled:pointer-events-none disabled:opacity-40"
    >
      {/* El «+» solo mientras quede algo que añadir: con el botón apagado
          invita a pulsar lo que ya no hace nada. */}
      {pendientes.length ? <span aria-hidden="true">+</span> : null}
      {pendientes.length ? t("anadir") : t("sinMas")}
    </button>
  );

  // ── Apilado: pantallas estrechas y movimiento reducido ──
  if (grafo === false) {
    return (
      <div className={`w-full ${className}`}>
        <ol className="flex flex-col">
          {tarjetas.map((c, i) => (
            <li key={c.id}>
              {/* La misma tarjeta que en el grafo, sin posicionar. En fila
                  —que es como estaba— el título y el pie salían al lado del
                  icono en vez de debajo. */}
              <div
                className="rounded-xl border bg-[var(--hueso)] px-3 py-[11px] text-[var(--tinta)]"
                style={{ borderColor: `${c.acento}38` }}
              >
                {cuerpo(c)}
              </div>
              {i < tarjetas.length - 1 && (
                <span aria-hidden="true" className="ml-[26px] block h-3.5 w-0.5 bg-[var(--verde)]/30" />
              )}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex justify-start">{boton}</div>
      </div>
    );
  }

  if (grafo === null) return <div className={`w-full ${className}`} style={{ minHeight: 320 }} />;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 flex justify-end">{boton}</div>

      <div ref={marcoRef} style={{ height: LIENZO.alto * escala }}>
        <div
          ref={zonaRef}
          className="relative touch-none"
          style={{
            width: LIENZO.ancho,
            height: LIENZO.alto,
            transform: `scale(${escala})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={t("alt")}
          >
            {enlaces.map(([de, a], i) => {
              const A = tarjetas.find((c) => c.id === de);
              const B = tarjetas.find((c) => c.id === a);
              if (!A || !B) return null;
              const vivo = encendido?.has(de) && encendido?.has(a);
              const d = curva(A, B, altoDe(de), altoDe(a));
              // Se escalonan para que no vayan todas a la vez, que parecería un
              // parpadeo en lugar de algo circulando.
              const retraso = `${(i % 4) * 0.7}s`;
              return (
                <g key={`${de}-${a}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke="#0A3D2E"
                    strokeWidth={vivo ? 2.6 : 2}
                    strokeLinecap="round"
                    strokeDasharray={vivo ? undefined : "7,6"}
                    opacity={encendido ? (vivo ? 0.95 : 0.18) : 0.4}
                    style={{ transition: "opacity .25s, stroke-width .25s" }}
                  />
                  {aLaVista && (
                    <>
                      {/* Halo ancho y tenue, y encima el punto de luz. Dos
                          trazos salen más baratos que un filtro de desenfoque,
                          que en SVG se rasteriza en cada fotograma. */}
                      <path
                        className="chispa"
                        d={d}
                        pathLength={1}
                        fill="none"
                        stroke="var(--hueso)"
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeDasharray="0.17 0.83"
                        opacity={0.34}
                        style={{ animationDelay: retraso }}
                      />
                      <path
                        className="chispa"
                        d={d}
                        pathLength={1}
                        fill="none"
                        stroke="var(--hueso)"
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeDasharray="0.1 0.9"
                        opacity={1}
                        style={{ animationDelay: retraso }}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {tarjetas.map((c) => (
            <div
              key={c.id}
              ref={medirTarjeta(c.id)}
              role="button"
              tabIndex={0}
              aria-label={`${t(`pasos.${c.id}.titulo`)}. ${t(`pasos.${c.id}.pie`)}. ${t("mover")}`}
              onPointerDown={alBajar(c.id)}
              onPointerMove={alMover(c.id)}
              onPointerUp={alSoltar(c.id)}
              onPointerCancel={alSoltar(c.id)}
              onKeyDown={alTeclado(c.id)}
              className="absolute cursor-grab rounded-xl border bg-[var(--hueso)] px-3 py-[11px] text-[var(--tinta)] shadow-[0_4px_12px_-6px_rgba(7,42,32,0.45)] transition-shadow hover:shadow-[0_12px_24px_-9px_rgba(7,42,32,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--verde-hondo)] active:cursor-grabbing"
              style={{ left: c.x, top: c.y, width: TARJETA.ancho, borderColor: `${c.acento}38` }}
            >
              {cuerpo(c)}
            </div>
          ))}
        </div>
      </div>

      <p className="mono mt-4 text-center text-[var(--verde)] opacity-55">{t("pista")}</p>
    </div>
  );
}
