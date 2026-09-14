/**
 * El botón de la landing, en sus dos pesos.
 *
 * Siempre ancla a #registro: la página tiene una sola acción posible y ningún
 * enlace de salida. Alto de 56px para superar el mínimo táctil cómodo en móvil,
 * que es donde llega casi todo el tráfico de Instagram.
 *
 * El texto por defecto es "diagnóstico", nunca "lista de espera": esa expresión
 * pone al visitante a pedir y a esperar. "Diagnóstico" dice que recibe algo, y
 * además es literal — la llamada de 30 minutos es exactamente eso.
 */
export const CTA_LABEL = "Quiero mi diagnóstico gratis";

export function CtaButton({
  children = CTA_LABEL,
  variant = "solid",
  reassurance,
}: {
  children?: React.ReactNode;
  variant?: "solid" | "ghost";
  reassurance?: string;
}) {
  /**
   * El principal va en lima con tinta encima: 12,8:1 de contraste y es el color
   * con el que se reconoce el sitio. La regla del lima se cumple —relleno con
   * texto oscuro, nunca letra lima sobre claro— y sobre el hueso de la página
   * no hay nada que compita con él, que es lo que tiene que pasar cuando solo
   * hay una acción posible.
   */
  const base =
    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold " +
    "transition-transform active:translate-y-px focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)]";
  const styles =
    variant === "solid"
      ? "bg-[var(--lima)] text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)]"
      : "border-[1.5px] border-[var(--verde)] bg-[var(--hueso)] text-[var(--verde)]";

  return (
    <div>
      <a href="#registro" className={`${base} ${styles}`}>
        {children}
        <span aria-hidden="true">→</span>
      </a>
      {reassurance && (
        <p className="mt-3 text-center text-[13px] text-[#77847C]">
          {reassurance}
        </p>
      )}
    </div>
  );
}
