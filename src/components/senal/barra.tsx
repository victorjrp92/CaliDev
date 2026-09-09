"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Logo } from "@/components/senal/logo";
import { MenuMovil } from "@/components/senal/menu-movil";
import { construirEnlaces, type EnlaceNav } from "@/components/senal/enlaces-nav";

const IDIOMAS = [
  { codigo: "en", etiqueta: "EN" },
  { codigo: "es", etiqueta: "ES" },
  { codigo: "de", etiqueta: "DE" },
];

/** A partir de aquí aparece el filete inferior, que marca que la página se movió. */
const UMBRAL = 24;

export function Barra() {
  const t = useTranslations("nav");
  const idioma = useLocale();
  const ruta = usePathname();
  const enlaces = construirEnlaces(t);

  const [velo, setVelo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [enServicios, setEnServicios] = useState(false);

  // Listener pasivo que solo escribe estado al cruzar el umbral: cambiarlo en
  // cada fotograma provocaría un render por píxel de scroll. El velo no depende
  // de esto —está siempre puesto—; lo único que cambia es el filete.
  useEffect(() => {
    const alDeslizar = () => {
      const pasado = window.scrollY > UMBRAL;
      setVelo((antes) => (antes === pasado ? antes : pasado));
    };
    alDeslizar();
    window.addEventListener("scroll", alDeslizar, { passive: true });
    return () => window.removeEventListener("scroll", alDeslizar);
  }, []);

  // «Servicios» se enciende cuando su sección está a la vista, no solo por la
  // ruta: en el home todas las secciones comparten la misma URL.
  useEffect(() => {
    const seccion = document.getElementById("servicios");
    if (!seccion) {
      // Fuera del home no hay sección que observar. El apagado se pide en el
      // siguiente fotograma y no en el cuerpo del efecto: cambiar estado aquí
      // mismo encadena un render extra antes de pintar.
      const fotograma = requestAnimationFrame(() => setEnServicios(false));
      return () => cancelAnimationFrame(fotograma);
    }
    const observador = new IntersectionObserver(
      ([e]) => setEnServicios(e.isIntersecting),
      { threshold: 0.15 }
    );
    observador.observe(seccion);
    return () => observador.disconnect();
  }, [ruta]);

  // Sin `useCallback`: el compilador de React memoiza esto solo, y envolverlo a
  // mano le impedía preservar la memoización de la lista de enlaces.
  const esActivo = (e: EnlaceNav) => {
    if (e.ancla) return ruta === "/" && enServicios;
    if (e.href === "/") return ruta === "/" && !enServicios;
    return typeof e.href === "string" && ruta.startsWith(e.href);
  };

  const cerrarMenu = () => setMenu(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          data-velo={velo}
          className="barra flex h-16 items-center backdrop-blur-xl backdrop-saturate-150 gap-6 px-5 text-[var(--hueso)] md:h-20 md:px-10"
        >
          <Link href="/" aria-label="CaliDev, inicio" className="flex-none">
            <Logo className="h-6 w-auto md:h-7" />
          </Link>

          <nav aria-label="Principal" className="ml-auto hidden md:block">
            <ul className="mono flex items-center gap-8">
              {enlaces.map((e) => (
                <li key={e.clave}>
                  <Link
                    href={e.href}
                    data-activo={esActivo(e)}
                    aria-current={esActivo(e) ? "page" : undefined}
                    className="enlace-barra"
                  >
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mono ml-auto flex items-center gap-1 md:ml-0">
            {IDIOMAS.map((l) => (
              <Link
                key={l.codigo}
                href={ruta}
                locale={l.codigo}
                aria-label={`Cambiar a ${l.etiqueta}`}
                aria-current={l.codigo === idioma ? "true" : undefined}
                className="px-1.5 py-1 transition-opacity"
                style={{
                  color: l.codigo === idioma ? "var(--lima)" : undefined,
                  opacity: l.codigo === idioma ? 1 : 0.6,
                }}
              >
                {l.etiqueta}
              </Link>
            ))}
          </div>

          <Link
            href="/contact"
            className="mono hidden flex-none rounded-full bg-[var(--lima)] px-5 py-2.5 text-[var(--tinta)] transition-[filter] hover:brightness-95 lg:inline-flex"
          >
            {t("schedule")}
          </Link>

          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            className="relative z-50 -mr-1 flex h-10 w-10 flex-none items-center justify-center md:hidden"
          >
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span
                className="block h-[1.5px] w-6 bg-current transition-transform duration-200"
                style={menu ? { transform: "translateY(3.25px) rotate(45deg)" } : undefined}
              />
              <span
                className="block h-[1.5px] w-6 bg-current transition-transform duration-200"
                style={menu ? { transform: "translateY(-3.25px) rotate(-45deg)" } : undefined}
              />
            </span>
          </button>
        </div>
      </header>

      <MenuMovil abierto={menu} alCerrar={cerrarMenu} enlaces={enlaces} activo={esActivo} />
    </>
  );
}
