import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Titular } from "@/components/senal/titular";

/**
 * Cómo trabajamos: tres principios a tres columnas.
 *
 * SIN numerar, a propósito. Un número promete un orden y aquí no lo hay: son
 * tres compromisos simultáneos, no tres pasos. Lo que los separa es un filete
 * lima arriba, que marca el arranque de cada uno sin sugerir secuencia.
 */
export function Principios() {
  const t = useTranslations("about");

  const principios = [
    { titulo: t("phil_lockin_title"), texto: t("phil_lockin_desc") },
    { titulo: t("phil_pay_title"), texto: t("phil_pay_desc") },
    { titulo: t("phil_honest_title"), texto: t("phil_honest_desc") },
  ];

  return (
    <Panel fondo="niebla">
      <Titular etiqueta="Cómo trabajamos" colorEtiqueta="var(--verde)" entrada={t("phil_desc")}>
        {t("phil_title")}
      </Titular>

      <ul className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {principios.map((p) => (
          <li key={p.titulo} className="border-t-2 border-[var(--lima)] pt-6">
            <h3 className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em]">{p.titulo}</h3>
            <p className="mt-4 text-[1.0625rem] leading-[1.65] opacity-75">{p.texto}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
