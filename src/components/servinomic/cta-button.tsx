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
  const base =
    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-transform active:translate-y-px";
  const styles =
    variant === "solid"
      ? "bg-[#0E7A5F] text-white shadow-[0_6px_18px_rgba(14,122,95,0.26)]"
      : "border-[1.5px] border-[#0E7A5F] bg-white text-[#0E7A5F]";

  return (
    <div>
      <a href="#registro" className={`${base} ${styles}`}>
        {children}
        <span aria-hidden="true">→</span>
      </a>
      {reassurance && (
        <p className="mt-3 text-center text-[13px] text-[#87938C]">
          {reassurance}
        </p>
      )}
    </div>
  );
}
