"use client";

import { useEffect, useRef } from "react";
import type { Seccion } from "@/lib/arranque/esquema";

/**
 * Arriba y fija: el porcentaje y un punto por sección. Las completas llevan
 * ✓, la actual se resalta (y se desplaza a la vista en el móvil, donde los
 * pasos no caben y se deslizan de lado), y todas se pueden tocar para ir a ellas. Es lo que
 * convierte una lista de datos en un camino con avance visible. La frase de
 * ánimo cambia con el porcentaje.
 */
function animo(p: number) {
  if (p === 0) return "Empecemos";
  if (p < 35) return "Buen comienzo";
  if (p < 65) return "Vas bien";
  if (p < 100) return "Ya casi terminas";
  return "¡Todo listo!";
}

export function BarraAvance({
  producto,
  secciones,
  porcentaje,
  completas,
  actual,
  onIr,
  guardado,
}: {
  producto: string;
  secciones: readonly Seccion[];
  porcentaje: number;
  completas: string[];
  actual: number;
  onIr: (i: number) => void;
  guardado: "guardado" | "guardando" | "error" | null;
}) {
  const lista = useRef<HTMLOListElement>(null);
  useEffect(() => {
    lista.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [actual]);
  return (
    <div className="sticky top-0 z-20 border-b border-[#E3E6E0] bg-[var(--hueso)]/95 backdrop-blur">
      <div className="mx-auto min-w-0 max-w-2xl px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="mono text-[var(--verde)]">
            Arranque de {producto} · <span className="font-semibold">{animo(porcentaje)}</span>
          </span>
          <span className="flex items-center gap-2">
            {guardado && (
              <span className={guardado === "error" ? "text-[#B42318]" : "text-[#5A6B63]"}>
                {guardado === "guardando" ? "Guardando…" : guardado === "error" ? "Sin conexión: no se guardó" : "Guardado"}
              </span>
            )}
            <b className="mono text-[15px]">{porcentaje}%</b>
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E3E6E0]" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del formulario">
          <div className="h-full rounded-full bg-[var(--lima)] transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${Math.max(porcentaje, 3)}%` }} />
        </div>
        <ol ref={lista} className="relative mt-2.5 flex min-w-0 max-w-full gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {secciones.map((s, i) => {
            const ok = completas.includes(s.id);
            const aqui = actual === i + 1;
            return (
              <li key={s.id} className="flex-none">
                <button
                  type="button"
                  onClick={() => onIr(i + 1)}
                  aria-current={aqui ? "step" : undefined}
                  className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-semibold ${
                    aqui ? "border-[var(--verde)] bg-white text-[var(--verde)]" : ok ? "border-transparent bg-[var(--verde)] text-[var(--lima)]" : "border-[#D8DCD4] bg-white text-[#5A6B63]"
                  }`}
                >
                  <span aria-hidden="true">{ok ? "✓" : i + 1}</span>
                  <span className={aqui ? "" : "hidden sm:inline"}>{s.titulo}</span>
                  <span className="sr-only">{ok ? " (completa)" : ""}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
