/**
 * Los enlaces de navegación, en un módulo aparte porque los comparten la barra,
 * el menú de móvil y el oráculo de enlaces rotos.
 */

/** Destino: una ruta del sitio, o el home con un ancla. */
export type DestinoNav = "/" | "/services" | "/about" | "/blog" | "/contact";

export type EnlaceNav = {
  clave: string;
  /** Texto ya traducido. */
  texto: string;
  href: DestinoNav | { pathname: "/"; hash: string };
  /** Ancla del home a la que apunta, si es el caso. */
  ancla?: string;
};

/**
 * «Servicios» apunta al ancla del home, no a `/services`.
 *
 * Es lo pedido: al pulsarlo hay que caer en la sección de servicios saltándose
 * el hero. La página `/services` sigue existiendo como el detalle —precios,
 * proceso, producto estrella— y se alcanza desde el panel de cierre del
 * recorrido horizontal. Embudo: vistazo en el home, detalle en la página.
 */
export function construirEnlaces(t: (clave: string) => string): EnlaceNav[] {
  return [
    { clave: "home", texto: t("home"), href: "/" },
    { clave: "services", texto: t("services"), href: { pathname: "/", hash: "servicios" }, ancla: "servicios" },
    { clave: "about", texto: t("about"), href: "/about" },
    { clave: "blog", texto: t("blog"), href: "/blog" },
    { clave: "contact", texto: t("contact"), href: "/contact" },
  ];
}
