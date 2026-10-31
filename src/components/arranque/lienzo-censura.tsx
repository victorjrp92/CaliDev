"use client";

import { useEffect, useRef, useState } from "react";
import type { Caja, Pagina } from "@/lib/arranque/paginas-documento";

/**
 * Una página del documento para tapar: se arrastra el dedo o el ratón sobre lo
 * que hay que ocultar y queda una caja negra, igual a como saldrá. Cada caja
 * tiene su × para quitarla. Mientras se dibuja, la página no se desplaza.
 */
export function LienzoCensura({ pagina, cajas, onCambio }: { pagina: Pagina; cajas: Caja[]; onCambio: (c: Caja[]) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const [nueva, setNueva] = useState<Caja | null>(null);

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    c.width = pagina.ancho;
    c.height = pagina.alto;
    c.getContext("2d")!.drawImage(pagina.lienzo, 0, 0);
  }, [pagina]);

  const punto = (e: React.PointerEvent) => {
    const r = capa.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const caja = (a: { x: number; y: number }, b: { x: number; y: number }): Caja => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  return (
    <div className="relative mx-auto w-fit max-w-full select-none">
      <canvas ref={lienzo} className="block h-auto max-h-[58vh] w-auto max-w-full rounded-lg border border-[#D8DCD4] bg-white" aria-label="Página del documento" />
      <div
        ref={capa}
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          inicio.current = punto(e);
          setNueva(caja(inicio.current, inicio.current));
        }}
        onPointerMove={(e) => inicio.current && setNueva(caja(inicio.current, punto(e)))}
        onPointerUp={(e) => {
          if (!inicio.current) return;
          const c = caja(inicio.current, punto(e));
          inicio.current = null;
          setNueva(null);
          if (c.w > 0.015 && c.h > 0.01) onCambio([...cajas, c]);
        }}
        onPointerCancel={() => {
          inicio.current = null;
          setNueva(null);
        }}
      >
        {cajas.map((c, i) => (
          <div key={i} className="absolute bg-black" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.w * 100}%`, height: `${c.h * 100}%` }}>
            <button
              type="button"
              onClick={() => onCambio(cajas.filter((_, j) => j !== i))}
              aria-label={`Quitar la caja ${i + 1}`}
              className="absolute -right-3 -top-3 grid h-7 w-7 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#B42318] text-[15px] font-bold leading-none text-white shadow"
            >
              ×
            </button>
          </div>
        ))}
        {nueva && (
          <div
            className="absolute border-2 border-[#B42318] bg-black/70"
            style={{ left: `${nueva.x * 100}%`, top: `${nueva.y * 100}%`, width: `${nueva.w * 100}%`, height: `${nueva.h * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
