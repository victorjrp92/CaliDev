import { useTranslations } from "next-intl";
import { Panel } from "@/components/senal/panel";
import { Titular } from "@/components/senal/titular";
import { Duotono } from "@/components/senal/duotono";

/**
 * Quiénes somos: dos retratos grandes.
 *
 * En duotono, como el resto de las imágenes del sitio, y vuelven a color al
 * acercarse. No es un efecto por tenerlo: el gris unifica dos fotos hechas en
 * momentos distintos y con fondos distintos, y el color aparece justo cuando
 * alguien se acerca a leer quién es cada uno — que es cuando importa verle la
 * cara de verdad.
 */
export function Equipo() {
  const t = useTranslations("about");

  const gente = [
    {
      id: "victor",
      nombre: t("team_victor_name"),
      papel: t("team_victor_role"),
      bio: t("team_victor_bio"),
      foto: "/nuevo/equipo/victor.webp",
    },
    {
      id: "karen",
      nombre: t("team_karen_name"),
      papel: t("team_karen_role"),
      bio: t("team_karen_bio"),
      foto: "/nuevo/equipo/karen.webp",
    },
  ];

  return (
    <Panel fondo="azul">
      <Titular etiqueta="El equipo" entrada={t("team_sub")}>
        {t("team_title")}
      </Titular>

      <ul className="mt-16 grid gap-12 md:grid-cols-2 md:gap-14">
        {gente.map((p) => (
          <li key={p.id}>
            <Duotono
              src={p.foto}
              alt={`${p.nombre}, ${p.papel}`}
              ancho={720}
              alto={900}
              revelaEnHover
              sizes="(min-width: 768px) 34rem, 100vw"
              className="aspect-[4/5] w-full rounded-2xl"
            />
            <h3 className="mt-7 text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
              {p.nombre}
            </h3>
            <p className="mono mt-3 text-[var(--lima)]">{p.papel}</p>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.7] opacity-75">{p.bio}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
