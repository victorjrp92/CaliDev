"use client";

import { useEffect, useState } from "react";
import { CTA_DELEGAR } from "@/lib/delegar/textos";

/**
 * Barra fija abajo, en la zona del pulgar, con el mismo botón de entrada.
 *
 * Solo aparece cuando hace falta. Se esconde:
 *  · mientras un botón de entrada (`data-cta-entrada`) está a la vista,
 *  · cuando el formulario está en pantalla — taparía sus propios botones,
 *  · mientras el video se reproduce,
 *  · con el teclado abierto: si hay un campo enfocado, la barra se come la
 *    mitad de la pantalla que queda.
 *
 * Los eventos del video no suben por el DOM, pero se pueden escuchar en fase de
 * captura desde el documento; así la barra no necesita saber dónde está el
 * reproductor.
 */
export function CtaFija() {
  const [visibles, setVisibles] = useState(new Set<Element>());
  const [video, setVideo] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const vigilados = [
      ...document.querySelectorAll("[data-cta-entrada]"),
      document.getElementById("registro"),
    ].filter((el): el is Element => el !== null);

    const observador = new IntersectionObserver((entradas) => {
      setVisibles((prev) => {
        const siguiente = new Set(prev);
        for (const e of entradas) {
          if (e.isIntersecting) siguiente.add(e.target);
          else siguiente.delete(e.target);
        }
        return siguiente;
      });
      setListo(true);
    });
    vigilados.forEach((el) => observador.observe(el));

    const play = (e: Event) => e.target instanceof HTMLVideoElement && e.target.controls && setVideo(true);
    const pausa = (e: Event) => e.target instanceof HTMLVideoElement && e.target.controls && setVideo(false);
    const foco = () => {
      const el = document.activeElement;
      setEscribiendo(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement);
    };

    document.addEventListener("play", play, true);
    document.addEventListener("pause", pausa, true);
    document.addEventListener("ended", pausa, true);
    document.addEventListener("focusin", foco);
    const salida = () => requestAnimationFrame(foco);
    document.addEventListener("focusout", salida);

    return () => {
      observador.disconnect();
      document.removeEventListener("play", play, true);
      document.removeEventListener("pause", pausa, true);
      document.removeEventListener("ended", pausa, true);
      document.removeEventListener("focusin", foco);
      document.removeEventListener("focusout", salida);
    };
  }, []);

  const oculta = !listo || visibles.size > 0 || video || escribiendo;

  return (
    <div
      aria-hidden={oculta}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#D8DCD4] bg-[#FAFAF7]/96 px-5 pb-[calc(11px+env(safe-area-inset-bottom))] pt-[11px] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none ${
        oculta ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-xl">
        <a
          href="#registro"
          tabIndex={oculta ? -1 : undefined}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)]"
        >
          {CTA_DELEGAR}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
