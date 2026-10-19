"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Recuadro para firmar con el dedo, el lápiz o el mouse.
 *
 * Pointer events cubren los tres; `touch-action: none` evita que el dedo
 * desplace la página mientras firma. El lienzo se dibuja al doble de densidad
 * en pantallas retina para que la firma no salga pixelada.
 *
 * Un toque suelto no es una firma: hace falta un trazo con algo de recorrido
 * para entregar la imagen.
 */
const MIN_PUNTOS = 12;

export function PadFirma({ onCambio }: { onCambio: (png: string | null) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const puntos = useRef(0);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const c = lienzo.current!;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#14201B";
  }, []);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = punto(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = punto(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    puntos.current += 1;
  }

  function terminar() {
    if (!dibujando.current) return;
    dibujando.current = false;
    const suficiente = puntos.current >= MIN_PUNTOS;
    setVacio(!suficiente);
    onCambio(suficiente ? lienzo.current!.toDataURL("image/png") : null);
  }

  function borrar() {
    const c = lienzo.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    puntos.current = 0;
    setVacio(true);
    onCambio(null);
  }

  return (
    <div>
      <div className="relative rounded-xl border-[1.5px] border-dashed border-[#B9C2BC] bg-white">
        <canvas
          ref={lienzo}
          aria-label="Recuadro para dibujar tu firma"
          className="block h-[180px] w-full cursor-crosshair touch-none select-none rounded-xl"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
        />
        {vacio && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[15px] text-[#8C948D]">
            Firma aquí con el dedo
          </span>
        )}
        <span className="pointer-events-none absolute bottom-10 left-6 right-6 border-b border-[#D8DCD4]" />
      </div>
      <button type="button" onClick={borrar} className="mt-2 cursor-pointer text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
        Borrar y volver a firmar
      </button>
    </div>
  );
}
