import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";

/**
 * Misión y visión a dos columnas.
 *
 * Con un filete entre ambas y no en tarjetas: son dos declaraciones del mismo
 * rango, y meterlas en cajas las convertiría en dos productos.
 */
export function Proposito() {
  const t = useTranslations("about");

  const bloques = [
    { titulo: t("mission_title"), texto: t("mission_desc") },
    { titulo: t("vision_title"), texto: t("vision_desc") },
  ];

  return (
    <Panel fondo="hueso">
      <div className="grid gap-12 md:grid-cols-2 md:gap-0">
        {bloques.map((b, i) => (
          <div
            key={b.titulo}
            className={i === 1 ? "md:border-l md:border-[var(--linea-tinta)] md:pl-14" : "md:pr-14"}
          >
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
              {b.titulo}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.7] opacity-75">{b.texto}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
