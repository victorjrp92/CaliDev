/**
 * La comprobación que corre DENTRO de la página, en un módulo aparte.
 *
 * Vive aquí porque la usan dos: el oráculo `alcanzabilidad.mjs` y su control
 * positivo. Cuando cada uno tenía su copia, el control demostraba que
 * funcionaba *la copia* — que es exactamente cómo un verificador acaba ciego
 * sin que nadie se entere. Con un solo cuerpo no pueden separarse.
 *
 * Se pasa tal cual a `page.evaluate`, así que no puede capturar nada del
 * ámbito de Node.
 */
export function titularesTapados() {
  const visibles = [];
  const tapados = [];

  for (const h of document.querySelectorAll("h1, h2")) {
    const r = h.getBoundingClientRect();
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;

    // Fuera de pantalla EN HORIZONTAL no es estar tapado. En el recorrido de
    // servicios los paneles viajan de lado, así que a media animación hay
    // titulares en x = −300 o x = 7280. Forzar el punto dentro del viewport
    // medía lo que hubiera en el borde y denunciaba titulares sanos.
    if (r.right <= 0 || r.left >= innerWidth) continue;

    // `pointer-events: none` no se puede cazar con un test de impacto:
    // `elementFromPoint` devuelve siempre lo que haya debajo. Es el caso de la
    // tipografía del hero. De eso se encarga `barra-tapa.mjs`, que mide
    // geometría en vez de impactos.
    if (getComputedStyle(h).pointerEvents === "none") continue;

    const texto = (h.textContent || "").trim().slice(0, 40);
    visibles.push(texto);

    // Un punto dentro del titular, hacia el arranque del texto.
    const x = Math.min(Math.max(r.left + 12, 1), innerWidth - 2);
    const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 2);
    const enPunto = document.elementFromPoint(x, y);

    // Solo vale el propio titular o algo suyo (un <span> dentro cuenta). Un
    // ANCESTRO no vale: si el navegador devuelve <body> o un envoltorio, es que
    // el titular no recibe el punto — hay algo encima. Aceptar ancestros dejaba
    // pasar cualquier capa fija, y con eso el oráculo no podía fallar nunca.
    if (!(enPunto !== null && (enPunto === h || h.contains(enPunto)))) tapados.push(texto);
  }

  return { visibles, tapados };
}

/**
 * Recorre una página de arriba abajo y devuelve los titulares que **nunca**
 * llegan a verse limpios.
 *
 * La regla es «tapado en todas las paradas en que aparece», y no «tapado en dos
 * o más». La versión de dos paradas parecía funcionar y no funcionaba: cazaba
 * porque el bucle iba hasta `scrollHeight`, pedía más scroll del que existe y
 * repetía el último fotograma varias veces, así que cualquier titular del final
 * de la página sumaba dos apariciones solo. El control positivo pasaba por ese
 * artefacto, no por detectar nada.
 *
 * Con la regla correcta, una barra fija normal —aunque sea absurdamente alta—
 * NO debe fallar aquí: tapa el titular un momento y se sigue bajando hasta
 * leerlo. Lo que sí falla es el contenido que no se puede liberar con scroll.
 * El caso del texto pegado al borde superior, que tampoco se puede liberar
 * porque no hay hacia dónde subir, lo cubre `barra-tapa.mjs`.
 */
export async function recorrer(pagina, paso = 450) {
  // El recorrido REAL, no `scrollHeight`: pedir más que el máximo deja la
  // página quieta y repite fotogramas.
  const maximo = await pagina.evaluate(() =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  );

  const vecesVisible = new Map();
  const vecesTapado = new Map();
  let paradas = 0;

  for (let y = 0; y <= maximo; y += paso) {
    await pagina.evaluate((y) => window.scrollTo(0, y), y);
    await pagina.waitForTimeout(260);
    const { visibles, tapados } = await pagina.evaluate(titularesTapados);
    for (const t of visibles) vecesVisible.set(t, (vecesVisible.get(t) ?? 0) + 1);
    for (const t of tapados) vecesTapado.set(t, (vecesTapado.get(t) ?? 0) + 1);
    paradas++;
  }

  const nuncaLegibles = [...vecesVisible]
    .filter(([t, veces]) => (vecesTapado.get(t) ?? 0) >= veces)
    .map(([t]) => t);

  return { paradas, persistentes: nuncaLegibles, titulares: vecesVisible.size };
}
