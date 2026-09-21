import type { Metadata } from "next";
import { FormularioOpinion } from "@/components/opinion/formulario";
import "@/styles/senal.css";

/**
 * La página que se manda por WhatsApp a las clientas para que califiquen.
 *
 * `noindex` a propósito: es un enlace privado para tres personas, no una página
 * del sitio. Que aparezca en una búsqueda la convertiría en un buzón abierto y
 * la media dejaría de significar nada.
 *
 * Fuera del árbol de idiomas y solo en español: las tres hablan español —Nadia
 * escribió su testimonio en español desde Sídney— y traducirla a tres idiomas
 * sería trabajo para nadie.
 */
export const metadata: Metadata = {
  title: "Tu opinión — Cali Dev",
  robots: { index: false, follow: false },
};

export default function OpinionPage() {
  return (
    <main className="senal min-h-screen bg-[var(--hueso)] px-5 py-12 text-[var(--tinta)]">
      <div className="mx-auto max-w-xl">
        <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--verde)]">
          Cali Dev
        </p>
        <h1 className="mt-3 text-[clamp(1.9rem,6vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
          ¿Cómo nos fue?
        </h1>
        <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[#46554D]">
          Un minuto, y nos ayuda más de lo que parece: quien llega nuevo a la
          página no nos conoce, y lo único que le dice si puede confiar es lo que
          digan las personas que ya trabajaron con nosotros.
        </p>

        <div className="mt-7">
          <FormularioOpinion />
        </div>

        <p className="mt-5 text-center text-[12.5px] leading-relaxed text-[#77847C]">
          Publicamos la nota media y cuántas personas la pusieron. Sea la que
          sea.
        </p>
      </div>
    </main>
  );
}
