import type { ReactNode } from "react";

/**
 * Etiqueta + titular + entrada, con el mismo ritmo en todas las páginas.
 *
 * La etiqueta va en lima porque solo aparece sobre fondos oscuros; sobre claro
 * se pasa `colorEtiqueta="var(--verde)"`, que es la regla del lima: nunca texto
 * lima sobre hueso o niebla.
 */
export function Titular({
  etiqueta,
  children,
  entrada,
  nivel = "h2",
  colorEtiqueta = "var(--lima)",
  className = "",
}: {
  etiqueta?: string;
  children: ReactNode;
  entrada?: ReactNode;
  nivel?: "h1" | "h2";
  colorEtiqueta?: string;
  className?: string;
}) {
  const Etiqueta = nivel;

  return (
    <div className={className}>
      {etiqueta && (
        <p className="mono" style={{ color: colorEtiqueta }}>
          {etiqueta}
        </p>
      )}
      <Etiqueta className="mt-6 max-w-[18ch] text-[clamp(2.2rem,5.5vw,4.4rem)] font-extrabold leading-[1.0] tracking-[-0.035em] text-balance">
        {children}
      </Etiqueta>
      {entrada && (
        <p className="mt-6 max-w-[54ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.65] opacity-75">
          {entrada}
        </p>
      )}
    </div>
  );
}
