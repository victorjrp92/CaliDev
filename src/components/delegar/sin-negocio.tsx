"use client";

import { forwardRef, useState } from "react";
import { EncabezadoPaso } from "@/components/delegar/encabezado-paso";

/**
 * Salida amable para quien todavía no tiene negocio. Reversible: si marcó por
 * error, vuelve con sus respuestas intactas. No pide datos de terceros ni
 * promete nada a cambio de compartir.
 */
export const SinNegocio = forwardRef<HTMLHeadingElement, { onCorregir: () => void }>(
  function SinNegocio({ onCorregir }, ref) {
    const [copiado, setCopiado] = useState(false);

    const copiar = async () => {
      try {
        await navigator.clipboard.writeText(`${location.origin}${location.pathname}`);
        setCopiado(true);
      } catch {
        setCopiado(false);
      }
    };

    return (
      <>
        <EncabezadoPaso
          ref={ref}
          titulo="Este formulario es para negocios en marcha"
          apoyo="Está pensado para negocios que ya están funcionando. Puedes conocer el caso o compartir esta página con alguien a quien le sirva."
        />
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={copiar}
            className="h-14 w-full cursor-pointer rounded-2xl bg-[var(--verde)] text-base font-bold text-[var(--hueso)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)]"
          >
            {copiado ? "Enlace copiado" : "Copiar el enlace de esta página"}
          </button>
          <a
            href="#caso"
            className="flex h-12 w-full items-center justify-center rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white text-[15px] font-semibold text-[var(--verde)]"
          >
            Conocer el caso de LimpiaExpress
          </a>
          <button
            type="button"
            onClick={onCorregir}
            className="h-12 w-full cursor-pointer text-[15px] font-semibold text-[var(--verde)] underline-offset-2 hover:underline"
          >
            Corregir mi respuesta
          </button>
        </div>
        <p role="status" className="sr-only">
          {copiado ? "Enlace copiado" : ""}
        </p>
      </>
    );
  }
);
