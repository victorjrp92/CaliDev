"use client";

import { forwardRef } from "react";

/**
 * «Paso N de 3», la barra de progreso y el título del paso.
 *
 * El título recibe el foco al cambiar de paso (`tabIndex={-1}`): quien usa
 * lector de pantalla oye dónde está, y en móvil la vista arranca desde arriba
 * del paso nuevo.
 */
export const EncabezadoPaso = forwardRef<
  HTMLHeadingElement,
  { paso?: 1 | 2 | 3; titulo: string; apoyo?: string }
>(function EncabezadoPaso({ paso, titulo, apoyo }, ref) {
  return (
    <div>
      {paso && (
        <>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={paso}
            aria-label={`Paso ${paso} de 3`}
            className="mb-4 flex gap-1.5"
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className={`h-1.5 flex-1 rounded-full ${n <= paso ? "bg-[var(--verde)]" : "bg-[#D8DCD4]"}`}
              />
            ))}
          </div>
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--verde)]">
            Paso {paso} de 3
          </p>
        </>
      )}
      <h3
        ref={ref}
        tabIndex={-1}
        className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight outline-none"
      >
        {titulo}
      </h3>
      {apoyo && <p className="mt-2 text-[15px] leading-relaxed text-[#2C3A33]">{apoyo}</p>}
    </div>
  );
});
