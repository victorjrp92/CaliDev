/**
 * El origen del sitio, en un solo sitio.
 *
 * Vivía copiado en cuatro archivos y con dos valores de caída distintos:
 * `sitemap.ts` y `robots.ts` caían a victorramosbe.com, el dominio anterior, y
 * las dos rutas de pago a calidev.dev. Copiado significa que nadie lo arregla
 * dos veces, y que una mitad del sitio puede contar una historia y la otra
 * mitad otra.
 *
 * De esas cuatro copias van dos: las de `sitemap.ts` y `robots.ts`, que eran
 * las que mentían sobre el dominio. Siguen declarando la suya
 * `src/app/api/payments/checkout/route.ts` y
 * `src/app/api/payments/create/route.ts`, ambas con la misma caída correcta a
 * calidev.dev pero sin `.trim()` ni la comprobación de abajo. Tocar código de
 * pagos exige permiso explícito y no se ha pedido, así que quedan pendientes y
 * escritas aquí para que no se olviden.
 *
 * `.trim()` no es decoración. La variable de entorno de producción llegó a
 * tener un tabulador delante, y como esto se interpola en plantillas nadie se
 * entera: el resultado es `\thttps://calidev.dev`, que no es una URL. Salía en
 * el `<loc>` de las 24 entradas del sitemap, en la línea `Sitemap:` del
 * robots.txt y en el campo `url` del JSON-LD —justo el que un buscador usa para
 * atar la marca a un dominio—. Una variable de entorno la edita cualquiera
 * desde un panel y no pasa por revisión; el sitio tiene que aguantar eso.
 *
 * La barra final también se quita: todo el código de aquí construye rutas como
 * `${SITIO}/es`, y un origen acabado en barra produce `//es`.
 */
const CAIDA = "https://calidev.dev";

/**
 * ¿Es esto un origen absoluto de web?
 *
 * Recortar espacios y barras deja pasar el error más fácil de cometer en ese
 * panel: escribir «calidev.dev» sin esquema. Eso no es una URL absoluta, y
 * `src/app/layout.tsx` hace `new URL(SITIO)` para `metadataBase` en la
 * evaluación del módulo raíz —no dentro de una función, no dentro de una
 * página—. Un `TypeError` ahí no rompe una página: no carga el layout del que
 * cuelga todo, y con él se cae el sitio ENTERO, incluidas las rutas que no
 * tienen nada que ver con metadatos.
 *
 * El mismo argumento del `.trim()` de arriba, un paso más allá: si esto lo
 * edita cualquiera sin revisión de código, el valor malo tiene que degradar a
 * la caída, no tumbar el despliegue. Un canonical apuntando al dominio por
 * defecto es un fallo de SEO que se ve y se arregla; un sitio que no responde,
 * no.
 *
 * Se exige http/https y no solo que `new URL` no reviente, porque `new URL`
 * acepta cualquier esquema: `mailto:calidev.dev` pasaría el constructor y
 * produciría `mailto:calidev.dev/es` en cada enlace del sitemap.
 */
function esOrigenAbsoluto(valor: string): boolean {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const CONFIGURADO = (process.env.NEXT_PUBLIC_SITE_URL || CAIDA).trim().replace(/\/+$/, "");

if (!esOrigenAbsoluto(CONFIGURADO)) {
  // Un aviso, no una excepción: el objetivo de todo esto es precisamente que el
  // sitio siga en pie. Pero callarse dejaría el dominio equivocado en el
  // sitemap y en los canonical sin que nadie se entere durante meses.
  console.warn(
    `[sitio] NEXT_PUBLIC_SITE_URL no es una URL http/https absoluta: ${JSON.stringify(CONFIGURADO)}. Se usa ${CAIDA}.`
  );
}

export const SITIO = esOrigenAbsoluto(CONFIGURADO) ? CONFIGURADO : CAIDA;
