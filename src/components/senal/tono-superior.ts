/**
 * De qué color es el fondo por el que asoma la barra cuando aún no hay velo.
 *
 * La barra sin cromo apoya su texto directamente sobre la página, así que el
 * color de ese texto no puede ser una constante: el home arranca en hueso y las
 * páginas interiores arrancan en verde. Fijarlo a mano dejaría una de las dos
 * ilegible, y sería además el tipo de dato que se olvida de actualizar cuando
 * alguien cambia el color de un panel.
 *
 * Por eso se mide. Se lee el fondo real del primer bloque de contenido y se
 * decide por luminancia, así que un panel que cambie de color arrastra la barra
 * con él sin que nadie tenga que acordarse.
 */
export type Tono = "claro" | "oscuro";

/** Luminancia relativa WCAG a partir de un `rgb()` calculado. */
function luminancia(color: string): number | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const partes = m[1].split(",").map((n) => parseFloat(n));
  const [r, g, b, a = 1] = partes;
  // Un fondo transparente no dice nada: hay que seguir buscando hacia arriba.
  if (a < 0.5 || Number.isNaN(r)) return null;
  const canal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Recorre desde el primer bloque de la página hacia arriba hasta encontrar un
 * fondo opaco. Devuelve `"claro"` si no encuentra ninguno: el fondo del sitio
 * es hueso, así que es la suposición que menos daño hace.
 */
export function detectarTono(): Tono {
  if (typeof document === "undefined") return "claro";

  const primero =
    document.querySelector("main > *") ?? document.querySelector("main") ?? document.body;

  let nodo: Element | null = primero;
  while (nodo) {
    const l = luminancia(getComputedStyle(nodo).backgroundColor);
    if (l !== null) return l > 0.35 ? "claro" : "oscuro";
    nodo = nodo.parentElement;
  }
  return "claro";
}
