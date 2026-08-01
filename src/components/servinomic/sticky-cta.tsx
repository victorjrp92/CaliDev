"use client";

import { useEffect, useState } from "react";
import { CTA_LABEL } from "@/components/servinomic/cta-button";

/**
 * CTA fijo en la zona del pulgar.
 *
 * Es la posición que más convierte en móvil, que es de donde llega casi todo el
 * tráfico: la acción queda siempre al alcance y se elimina el scroll de regreso.
 *
 * Se oculta cuando el formulario entra en pantalla. Sin eso, en móvil la barra
 * taparía el botón de enviar del propio formulario — y además repetir "entrar a
 * la lista" mientras la persona ya la está llenando es ruido.
 */
export function StickyCta({ slots }: { slots: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const form = document.getElementById("registro");
    if (!form) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#E7E1D7] bg-[#FBF8F3]/96 px-5 pb-[calc(11px+env(safe-area-inset-bottom))] pt-[11px] backdrop-blur-md transition-transform duration-300 ${
        hidden ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-xl">
        <a
          href="#registro"
          tabIndex={hidden ? -1 : undefined}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7A5F] text-base font-bold text-white shadow-[0_6px_18px_rgba(14,122,95,0.26)] transition-transform active:translate-y-px"
        >
          {CTA_LABEL}
          <span aria-hidden="true">→</span>
        </a>
        <p className="mt-[7px] text-center text-[11.5px] text-[#87938C]">
          Quedan {slots} cupos · Revisamos cada caso a mano
        </p>
      </div>
    </div>
  );
}
