"use client";

import { useEffect, useRef } from "react";

/**
 * El premio de completar una sección: confeti breve, el logro en palabras y
 * cuánto va. Sin animación si la persona la tiene desactivada en su teléfono.
 */
const COLORES = ["#C8F045", "#0A3D2E", "#00D492", "#FFC24A", "#14201B"];

export function Celebracion({ titulo, texto, porcentaje, onSeguir, final = false }: { titulo: string; texto: string; porcentaje: number; onSeguir: () => void; final?: boolean }) {
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => boton.current?.focus(), []);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="celebracion-titulo" className="fixed inset-0 z-50 grid place-items-center bg-[rgba(20,32,27,.55)] px-4">
      <style>{`
        @keyframes caer { from { transform: translate3d(0,-20vh,0) rotate(0) } to { transform: translate3d(var(--x),105vh,0) rotate(720deg) } }
        @keyframes entrar { from { transform: scale(.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .confeti { position: fixed; top: 0; width: 9px; height: 14px; border-radius: 2px; animation: caer 1.8s ease-in forwards; pointer-events: none }
        .tarjeta-logro { animation: entrar .35s cubic-bezier(.2,1.4,.4,1) both }
        @media (prefers-reduced-motion: reduce) { .confeti { display: none } .tarjeta-logro { animation: none } }
      `}</style>
      {Array.from({ length: final ? 60 : 28 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="confeti"
          style={{ left: `${(i * 37) % 100}%`, background: COLORES[i % COLORES.length], animationDelay: `${(i % 7) * 0.08}s`, ["--x" as string]: `${((i % 5) - 2) * 30}px` }}
        />
      ))}
      <div className="tarjeta-logro w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--lima)] text-[30px] font-black text-[var(--verde)]">
          ✓
        </div>
        <h2 id="celebracion-titulo" className="mt-4 text-[24px] font-extrabold leading-tight tracking-tight">
          {titulo}
        </h2>
        <p className="mt-2 text-[15.5px] leading-relaxed text-[#2C3A33]">{texto}</p>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#E3E6E0]">
          <div className="h-full rounded-full bg-[var(--verde)]" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="mono mt-2 text-[13px] text-[var(--verde)]">{porcentaje}% completado</p>
        <button ref={boton} type="button" onClick={onSeguir} className="mt-5 min-h-12 w-full cursor-pointer rounded-xl bg-[var(--verde)] text-[16px] font-bold text-white">
          {final ? "Ver resumen" : "Seguir"}
        </button>
      </div>
    </div>
  );
}
