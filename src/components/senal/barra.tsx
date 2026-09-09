"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Logo } from "@/components/senal/logo";
import { MenuMovil } from "@/components/senal/menu-movil";
import { SelectorIdioma } from "@/components/senal/selector-idioma";
import { BotonAgenda } from "@/components/senal/boton-agenda";
import { useLineaViva } from "@/components/senal/use-linea-viva";
import { construirEnlaces, type EnlaceNav } from "@/components/senal/enlaces-nav";
import { detectarTono, type Tono } from "@/components/senal/tono-superior";

/** A partir de aquí aparece el filete inferior, que marca que la página se movió. */
const UMBRAL = 24;

export function Barra() {
  const t = useTranslations("nav");
  const ruta = usePathname();
  const enlaces = construirEnlaces(t);

  const [velo, setVelo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [enServicios, setEnServicios] = useState(false);
  const [tono, setTono] = useState<Tono>("claro");

  const { zona, casa, tramo, quieto, seguible, volverACasa } = useLineaViva();

  // El fondo por el que asoma la barra cuando aún no hay velo. Se mide en vez
  // de suponerse: el home arranca en hueso y las interiores en verde.
  useEffect(() => {
    const medir = () => setTono(detectarTono());
    const fotograma = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(fotograma);
  }, [ruta]);

  // Listener pasivo que solo escribe estado al cruzar el umbral: cambiarlo en
  // cada fotograma provocaría un render por píxel de scroll. El velo no depende
  // de esto —está siempre puesto—; lo único que cambia es el filete inferior.
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
  // ruta: en el home todas las secciones comparten URL.
  useEffect(() => {
    const seccion = document.getElementById("servicios");
    if (!seccion) {
      // Fuera del home no hay sección que observar. El apagado se pide en el
      // siguiente fotograma y no en el cuerpo del efecto: cambiar estado aquí
      // mismo encadena un render extra antes de pintar.
      const fotograma = requestAnimationFrame(() => setEnServicios(false));
      return () => cancelAnimationFrame(fotograma);
    }
    const observador = new IntersectionObserver(([e]) => setEnServicios(e.isIntersecting), {
      threshold: 0.15,
    });
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
          className={`barra flex items-center gap-6 px-5 md:px-10 ${
            velo ? "backdrop-blur-xl backdrop-saturate-150" : ""
          }`}
          style={{
            // Con velo el texto es siempre hueso: el velo domina la mezcla y da
            // 6,09:1 sobre el peor fondo. Sin velo lo decide lo que hay detrás.
            color: velo || tono === "oscuro" ? "var(--hueso)" : "var(--verde)",
          }}
        >
          <Link href="/" aria-label="CaliDev, inicio" className="flex-none">
            <Logo className="h-6 w-auto md:h-7" />
          </Link>

          {/* Zona seguible: el filete se mueve en coordenadas de esta caja, así
              que todo lo que pueda recibirlo tiene que vivir aquí dentro. */}
          <div
            ref={zona}
            onMouseLeave={volverACasa}
            className="relative ml-auto flex items-center gap-5 md:gap-8"
          >
            <nav aria-label="Principal" className="hidden md:block">
              <ul className="mono flex items-center gap-8">
                {enlaces.map((e) => (
                  <li key={e.clave}>
                    <Link
                      href={e.href}
                      data-activo={esActivo(e)}
                      aria-current={esActivo(e) ? "page" : undefined}
                      className="enlace-barra"
                      {...seguible}
                    >
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <SelectorIdioma {...seguible} />

            <BotonAgenda ref={casa} texto={t("schedule")} className="hidden lg:flex" {...seguible} />

            {/* En móvil la agenda y los enlaces están ocultos, así que la casa
                del filete mide cero: sin esta guarda se pintaría un elemento
                invisible de ancho cero en cada render. */}
            {tramo && tramo.ancho > 0 && (
              <span
                aria-hidden="true"
                className="linea-viva"
                data-quieto={quieto}
                style={{ transform: `translateX(${tramo.x}px)`, width: `${tramo.ancho}px` }}
              />
            )}
          </div>

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
