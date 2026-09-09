import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";

/**
 * Las tres formas del botón, y por qué son tres y no dos.
 *
 * `primario` es lima con texto tinta: el lima solo puede llevar texto encima si
 * el texto es oscuro (12,8:1). `verde` es el sólido para fondos claros — sobre
 * hueso da 11,7:1 y es lo que lleva el panel de cierre. `invertido` (tinta con
 * texto lima) queda para fondos lima, donde un botón lima sería invisible.
 * `secundario` es solo filete y hereda el color del panel, así que funciona
 * sobre cualquiera de los fondos.
 */
const FORMAS = {
  primario: "bg-[var(--lima)] text-[var(--tinta)] hover:brightness-95",
  invertido: "bg-[var(--tinta)] text-[var(--lima)] hover:brightness-125",
  verde: "bg-[var(--verde)] text-[var(--hueso)] hover:brightness-125",
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
  locale,
  children,
  className = "",
}: {
  /** Ruta interna: se enruta con el idioma activo. */
  href?: RutaInterna;
  /** Fuerza otro idioma. Lo usa el blog para mandar a donde sí hay artículos. */
  locale?: string;
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
    <Link href={href ?? "/contact"} locale={locale} className={clases}>
      {children}
    </Link>
  );
}
