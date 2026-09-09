import type { ReactNode } from "react";

/**
 * Fondos de SEÑAL y el color de texto que cada uno obliga.
 *
 * El emparejamiento vive aquí y no en cada sección a propósito: es la regla que
 * más fácil se rompe cuando alguien duplica un bloque y le cambia el fondo sin
 * mirar el texto. Todos los pares están medidos en `scripts/oraculos/contraste.mjs`.
 */
const FONDOS = {
  verde: "bg-[var(--verde)] text-[var(--hueso)]",
  "verde-hondo": "bg-[var(--verde-hondo)] text-[var(--hueso)]",
  azul: "bg-[var(--azul)] text-[var(--niebla)]",
  hueso: "bg-[var(--hueso)] text-[var(--tinta)]",
  niebla: "bg-[var(--niebla)] text-[var(--tinta)]",
  lima: "bg-[var(--lima)] text-[var(--tinta)]",
} as const;

export type Fondo = keyof typeof FONDOS;

/**
 * Sección a sangre con el ritmo vertical del sitio.
 *
 * `id` añade además el margen de scroll: la barra es fija, así que sin él un
 * salto por ancla deja el titular debajo de la barra.
 */
export function Panel({
  fondo,
  id,
  children,
  className = "",
  ancho = "normal",
}: {
  fondo: Fondo;
  id?: string;
  children: ReactNode;
  className?: string;
  /** `ancho` deja el contenido a sangre; lo usan las secciones con su propia rejilla. */
  ancho?: "normal" | "ancho";
}) {
  return (
    <section
      id={id}
      className={`${FONDOS[fondo]} px-7 py-24 md:px-14 md:py-32 ${id ? "scroll-mt-20" : ""} ${className}`}
    >
      <div className={ancho === "normal" ? "mx-auto max-w-6xl" : ""}>{children}</div>
    </section>
  );
}
