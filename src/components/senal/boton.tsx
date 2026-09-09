import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";

/**
 * Las tres formas del botón, y por qué son tres y no dos.
 *
 * `primario` es lima con texto tinta: el lima solo puede llevar texto encima si
 * el texto es oscuro (12,8:1). `invertido` existe para el panel de cierre, que
 * ya es lima entero — allí un botón lima sería invisible, así que se le da la
 * vuelta. `secundario` es solo filete y hereda el color del panel, así que
 * funciona sobre cualquiera de los seis fondos.
 */
const FORMAS = {
  primario: "bg-[var(--lima)] text-[var(--tinta)] hover:brightness-95",
  invertido: "bg-[var(--tinta)] text-[var(--lima)] hover:brightness-125",
  secundario: "border border-current/30 hover:bg-current/8",
} as const;

export type FormaBoton = keyof typeof FORMAS;

const BASE =
  "mono inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 transition-all duration-200 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

/** Rutas internas del sitio, tal como las conoce `@/i18n/routing`. */
type RutaInterna = "/" | "/services" | "/about" | "/blog" | "/contact";

export function Boton({
  href,
  externo,
  forma = "primario",
  children,
  className = "",
}: {
  /** Ruta interna: se enruta con el idioma activo. */
  href?: RutaInterna;
  /** Destino externo o de protocolo (mailto:, https://wa.me/...). */
  externo?: string;
  forma?: FormaBoton;
  children: ReactNode;
  className?: string;
}) {
  const clases = `${BASE} ${FORMAS[forma]} ${className}`;

  if (externo) {
    const esProtocolo = /^(mailto:|tel:)/.test(externo);
    return (
      <a
        href={externo}
        className={clases}
        {...(esProtocolo ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href ?? "/contact"} className={clases}>
      {children}
    </Link>
  );
}
