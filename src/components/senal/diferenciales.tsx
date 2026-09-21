import { useTranslations } from "next-intl";

/**
 * Las cuatro pastillas de diferenciales.
 *
 * Dicen el valor sin pedir contexto: quien llega no sabe quiénes somos, así que
 * no sirve un badge que haya que descifrar. «No se rompe a los seis meses»
 * cuenta que los sistemas los firma una ingeniera de sistemas sin que nadie
 * tenga que saber quién es.
 *
 * Vivían en una banda propia justo al salir del hero y se movieron al panel de
 * entrada de Servicios: ahí ya había media pantalla vacía a la derecha, y esta
 * es además la primera pantalla del sitio para quien entra por «Servicios» del
 * menú. Una banda suelta entre dos secciones era un tercer bloque donde ya
 * había sitio en el segundo.
 */
export function Diferenciales({ className = "" }: { className?: string }) {
  const t = useTranslations("senal.diferenciales");
  const pastillas = t.raw("pastillas") as string[];

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {pastillas.map((texto, i) => (
        <li
          key={texto}
          className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold leading-tight tracking-[-0.005em] md:text-[14px] md:px-4 md:py-2.5 ${
            // La primera en verde sólido y el resto bajando de peso: cuatro al
            // mismo tono se leen como una lista que nadie termina. La lima no
            // aparece — sobre fondo claro no llega a 1,5:1 y no puede llevar
            // texto encima.
            i === 0
              ? "bg-[var(--verde)] text-[var(--hueso)]"
              : i === 3
                ? "text-[var(--verde-hondo)] ring-[1.4px] ring-inset ring-[#CFD5CB]"
                : "bg-[#E6E8E3] text-[var(--verde-hondo)]"
          }`}
        >
          {texto}
        </li>
      ))}
    </ul>
  );
}
