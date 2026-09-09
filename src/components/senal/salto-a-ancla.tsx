"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

/**
 * Salto a un ancla del home, corregido después de que GSAP mida.
 *
 * El navegador salta al ancla en cuanto encuentra el elemento, pero en esta
 * página la sección de servicios está anclada con ScrollTrigger y el pin añade
 * un espaciador que cambia el alto total *después* de ese salto. Resultado: se
 * entra por `/#servicios` y se aterriza donde estaba la sección antes de medir,
 * que es justo el atajo que la barra promete y no cumple.
 *
 * Reparto de papeles, y es lo que importa: `colocar` solo hace scroll y
 * `refrescar` solo mide. La primera versión los mezclaba —el mismo manejador
 * llamaba a `ScrollTrigger.refresh()` y estaba suscrito al evento `refresh`—,
 * así que se llamaba a sí mismo y no colocaba nada. El síntoma era la página
 * quieta en el hero.
 */
export function SaltoAncla() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length < 2) return;

    let vivo = true;

    const colocar = () => {
      if (!vivo) return;
      const destino = document.querySelector(hash);
      if (!(destino instanceof HTMLElement)) return;
      // Una sección anclada se queda fija en `top: 0` durante TODO su recorrido,
      // así que apuntar a ella deja al navegador elegir cualquier punto del
      // recorrido: se entraba por «Servicios» y se aterrizaba en el panel 2, ya
      // empezado. El espaciador que GSAP pone alrededor sí ocupa sitio real, y
      // su borde superior es el principio del recorrido.
      const conSitio = destino.closest<HTMLElement>(".pin-spacer") ?? destino;
      conSitio.scrollIntoView({ block: "start" });
    };

    const refrescar = () => {
      if (vivo) ScrollTrigger.refresh();
    };

    // Al terminar de medir, colocar. Nada dentro de `colocar` vuelve a medir.
    ScrollTrigger.addEventListener("refresh", colocar);

    // Tres momentos en que la altura de la página cambia: el pin ya creado, la
    // carga completa (el vídeo del hero) y un último repaso por si alguna
    // fuente entra tarde.
    const primero = requestAnimationFrame(refrescar);
    window.addEventListener("load", refrescar);
    const tarde = setTimeout(refrescar, 600);

    return () => {
      vivo = false;
      ScrollTrigger.removeEventListener("refresh", colocar);
      window.removeEventListener("load", refrescar);
      cancelAnimationFrame(primero);
      clearTimeout(tarde);
    };
  }, []);

  return null;
}
