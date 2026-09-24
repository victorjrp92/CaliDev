"use client";

import { forwardRef } from "react";
import { PLAZO_RESPUESTA } from "@/lib/delegar/textos";

/**
 * Confirmación, solo después de que el servidor confirmó el guardado.
 *
 * Dice qué pasa ahora y por dónde, con el número que dejó a la vista para que
 * lo pueda revisar. «Corregir mi número» vuelve al paso 2 y actualiza la misma
 * solicitud: no crea otra.
 */
export const Confirmacion = forwardRef<
  HTMLHeadingElement,
  { nombre: string; whatsapp: string; onCorregir: () => void }
>(function Confirmacion({ nombre, whatsapp, onCorregir }, ref) {
  const primerNombre = nombre.trim().split(/\s+/)[0];
  return (
    <div className="py-2 text-center">
      <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6E8E3]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
          <path d="M5 12.5 10 17.5 19 7.5" stroke="#0A3D2E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 ref={ref} tabIndex={-1} className="mt-5 text-[24px] font-extrabold leading-tight tracking-tight outline-none">
        Recibimos tu solicitud{primerNombre ? `, ${primerNombre}` : ""}.
      </h3>
      <p className="mx-auto mt-3 max-w-sm text-[16px] leading-relaxed text-[#2C3A33]">
        Revisaremos lo que nos contaste y te contactaremos por WhatsApp al{" "}
        <strong className="whitespace-nowrap font-bold text-[var(--tinta)]">{whatsapp}</strong> para
        explicarte el siguiente paso.{PLAZO_RESPUESTA ? ` ${PLAZO_RESPUESTA}.` : ""}
      </p>
      <button
        type="button"
        onClick={onCorregir}
        className="mt-5 h-12 cursor-pointer px-4 text-[15px] font-semibold text-[var(--verde)] underline underline-offset-2"
      >
        Corregir mi número
      </button>
    </div>
  );
});
