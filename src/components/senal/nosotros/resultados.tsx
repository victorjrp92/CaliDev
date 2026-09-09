import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Titular } from "@/components/senal/titular";

/**
 * Resultados de clientes reales.
 *
 * Tres cifras, no cuatro. La que falta era «+37 % en utilidades», y se retiró:
 * no la puedo verificar y además hay una regla firme sobre este cliente — de sus
 * finanzas solo se publica crecimiento relativo, nunca cifras de ingresos ni de
 * utilidad. Y «12 → 19 empleados» estaba mal: son 10 → 22 colaboradoras.
 * Publicar tres cifras ciertas vale más que cuatro con una dudosa.
 */
export function Resultados() {
  const t = useTranslations("about");

  const cifras = [1, 2, 3].map((i) => ({
    valor: t(`t_limpia_s${i}_val`),
    etiqueta: t(`t_limpia_s${i}_label`),
  }));

  return (
    <Panel fondo="verde">
      <Titular etiqueta="Resultados" entrada={t("results_sub")}>
        {t("results_title")}
      </Titular>

      <div className="mt-16 grid gap-12 md:grid-cols-[1fr_auto] md:items-start md:gap-20">
        <figure className="m-0">
          <blockquote className="serif text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.35]">
            {t("t_limpia_text")}
          </blockquote>
          <figcaption className="mt-8">
            <p className="mono text-[var(--lima)]">{t("t_limpia_name")}</p>
            <p className="mt-1.5 text-[15px] opacity-65">{t("t_limpia_role")}</p>
          </figcaption>
        </figure>

        <dl className="grid gap-9 sm:grid-cols-3 md:grid-cols-1">
          {cifras.map((c) => (
            <div key={c.etiqueta}>
              <dt className="sr-only">{c.etiqueta}</dt>
              <dd className="m-0">
                <span className="block text-[clamp(2.2rem,4vw,3rem)] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                  {c.valor}
                </span>
                <span className="mono mt-3 block opacity-60">{c.etiqueta}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}
