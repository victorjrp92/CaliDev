import { useTranslations } from "next-intl";
import { Orbitas } from "@/components/nuevo/orbitas";
import { TODAS } from "@/lib/nuevo/herramientas";

/**
 * Cierre de la página: con qué está hecho todo lo anterior.
 *
 * Va después de los servicios a propósito — primero se ve qué construimos,
 * y solo entonces importa con qué. La lista de nombres bajo las órbitas no es
 * redundante: es la versión que leen los lectores de pantalla y los buscadores,
 * donde nueve logos girando no dicen nada.
 */
export function Herramientas() {
  const t = useTranslations("senal.herramientas");

  return (
    <section id="herramientas" className="scroll-mt-20 relative overflow-hidden bg-[var(--azul)] pt-24 text-[var(--niebla)] md:pt-28">
      <div className="mx-auto max-w-5xl px-7 text-center md:px-14">
        <p className="mono text-[var(--lima)]">{t("etiqueta")}</p>
        <h2 className="mx-auto mt-6 max-w-[17ch] text-[clamp(2.2rem,5.5vw,4.6rem)] font-extrabold leading-[1.0] tracking-[-0.035em]">
          {t("titulo")}
        </h2>
        <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--niebla)]/70">
          {t("entrada")}
        </p>

        <ul className="mono mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[var(--niebla)]/55">
          {TODAS.map((h) => (
            <li key={h.id}>{h.nombre}</li>
          ))}
        </ul>
      </div>

      <Orbitas className="-mt-2 md:-mt-6" />
    </section>
  );
}
