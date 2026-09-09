# SEÑAL para todo el sitio — plan de implementación

> Spec: `docs/superpowers/specs/2026-09-09-senal-sitio-completo.md`
> Pasos con casilla `- [ ]`. Commit local al final de cada fase; **nunca push**.

**Meta:** un solo sitio en SEÑAL —home, nosotros, blog, contacto, servicios—
con barra y pie propios, en ES/EN/DE, con el home actual reemplazado.

**Arquitectura:** `[locale]/layout.tsx` pasa a ser la cáscara SEÑAL (tres
fuentes + `senal.css`, sin `next-themes`). Las páginas se rehacen una a una
sobre piezas compartidas en `src/components/senal/`. `/nuevo` acaba
redirigiendo a `/`.

**Herramientas:** Next 16.2.4 · React 19 · Tailwind 4 · next-intl 4 · GSAP 3.15
· Playwright para los oráculos · Codex para imágenes (coste 0).

---

## Fase A — Fundación y oráculos

### Tarea A1: mover SEÑAL a una hoja compartida

**Archivos:**
- Crear: `src/styles/senal.css` (contenido de `src/app/nuevo/senal.css` + fichas nuevas)
- Modificar: `src/app/nuevo/layout.tsx` (importar la ruta nueva)

- [x] **A1.1** `git mv src/app/nuevo/senal.css src/styles/senal.css`
- [x] **A1.2** Añadir al bloque `.senal` las fichas de estructura:

```css
  --verde-hondo: #072a20;
  --linea: rgba(250, 250, 247, 0.14);
  --linea-tinta: rgba(20, 32, 27, 0.12);
  --cristal: rgba(10, 61, 46, 0.78);
```

- [x] **A1.3** Corregir el import en `src/app/nuevo/layout.tsx` a `@/styles/senal.css`
- [x] **A1.4** `npx tsc --noEmit && npm run build` → compila
- [x] **A1.5** Playwright: `/nuevo` sigue idéntica (captura contra la de referencia)

### Tarea A2: escribir los seis oráculos y probarlos rotos

**Archivos:**
- Crear: `scripts/oraculos/contraste.mjs`, `alcanzabilidad.mjs`, `paridad-i18n.mjs`, `anclas.mjs`, `enlaces.mjs`, `render.mjs`
- Crear: `scripts/oraculos/correr.sh` (los ejecuta todos, sale distinto de 0 si alguno falla)

- [x] **A2.1** `contraste.mjs`: función `ratio(fg,bg)` WCAG; compone
  `--cristal` sobre cada uno de los cinco fondos y mide hueso encima; además
  comprueba la lista de pares declarados en el spec. Sale 1 si alguno < 4.5.
- [x] **A2.2** Probarlo roto: añadir el par `["#C8F045","#FAFAF7"]` → debe fallar
  con 1.5. Quitarlo. **Si no falla, el oráculo está ciego.**
- [x] **A2.3** `alcanzabilidad.mjs`: por cada ruta, hace scroll real en pasos de
  media pantalla y para cada `h1,h2` comprueba `document.elementFromPoint(cx,cy)`
  contenido en el propio titular. Sale 1 si alguno queda tapado.
- [x] **A2.4** Probarlo roto: subir la barra a `height: 300px` → deben caer
  titulares. Restaurar.
- [x] **A2.5** `paridad-i18n.mjs`: aplana es/en/de y compara conjuntos de claves
  y valores no vacíos.
- [x] **A2.6** Probarlo roto: borrar `nav.blog` de `de.json` → falla. Restaurar.
- [x] **A2.7** `anclas.mjs`: va a `/es#servicios`, espera red inactiva + 1,5 s,
  mide `getBoundingClientRect().top` de `#servicios`; falla si |top| > 100.
- [x] **A2.8** Probarlo roto: quitar el `scroll-margin-top`. Restaurar.
- [x] **A2.9** `enlaces.mjs`: recoge los `href` de barra y pie, pide cada uno,
  falla si alguno no es 200.
- [x] **A2.10** Probarlo roto: añadir un enlace a `/inexistente`. Restaurar.
- [x] **A2.11** `render.mjs`: cada ruta responde 200 y su `h1` tiene texto.
- [x] **A2.12** Probarlo roto: vaciar un `h1`. Restaurar.
- [x] **A2.13** Commit: `test(senal): seis oráculos, cada uno probado roto`

### Tarea A3: piezas compartidas

**Archivos (uno por componente, según la preferencia del repo):**
- Crear: `src/components/senal/panel.tsx`, `titular.tsx`, `boton.tsx`, `duotono.tsx`, `relojes.tsx`

- [x] **A3.1** `panel.tsx`: props `fondo: "verde"|"hueso"|"niebla"|"azul"|"lima"|"verde-hondo"`,
  `id?`, `className?`. Aplica fondo, color de texto correcto para ese fondo, y
  `scroll-margin-top: 5rem` cuando lleva `id`.
- [x] **A3.2** `titular.tsx`: `etiqueta`, `children` (h2), `entrada?`, `nivel?`.
- [x] **A3.3** `boton.tsx`: variantes `primario` (lima/tinta), `secundario`
  (filete), `invertido` (tinta/lima, para fondo lima). Renderiza `Link` de
  `@/i18n/routing` si `href` es interno.
- [x] **A3.4** `duotono.tsx`: extraer el tratamiento de `.reel-foto` a una clase
  reutilizable `.duotono` en `senal.css`; el componente envuelve `next/image`.
- [x] **A3.5** `relojes.tsx`: extraer el reloj de `work-page-hero.tsx` (usa
  `requestAnimationFrame` para el primer valor, no `setState` en el efecto).
  El hero pasa a consumirlo.
- [x] **A3.6** `npx tsc --noEmit` y `npx eslint src/components/senal/`
- [x] **A3.7** Commit: `feat(senal): piezas compartidas de la cáscara`

---

## Fase B — Barra, pie y cierre

### Tarea B1: barra superior de cristal

**Archivos:** Crear `src/components/senal/barra.tsx`, `src/components/senal/menu-movil.tsx`

- [x] **B1.1** Barra fija con dos estados; el velo entra con `scrollY > 24`
  mediante un listener pasivo que solo cambia una clase (nada de estado por
  fotograma).
- [x] **B1.2** Enlaces: Inicio (`/`), Servicios (`/#servicios`), Nosotros
  (`/about`), Blog (`/blog`), Contacto (`/contact`). Activo por `usePathname`;
  «Servicios» activo además cuando `#servicios` está a la vista
  (IntersectionObserver).
- [x] **B1.3** Selector de idioma y botón «Agendar una llamada» (lima/tinta).
- [x] **B1.4** `menu-movil.tsx`: capa verde a pantalla completa, foco atrapado,
  cierre con Escape, `aria-expanded` en el disparador.
- [x] **B1.5** Correr `contraste` → hueso sobre cristal pasa sobre los 5 fondos.
- [x] **B1.6** Correr `alcanzabilidad` → ningún titular tapado por la barra.
- [x] **B1.7** Commit.

### Tarea B2: pie de página

**Archivos:** Crear `src/components/senal/pie.tsx`

- [x] **B2.1** Fondo `--verde-hondo`; logo, lema con palabra en Instrument,
  columnas Servicios y Empresa, relojes, idiomas, copyright, sociales.
- [x] **B2.2** **Omitir la columna Legal** hasta que Victor dé los textos: un
  enlace a una página inexistente es un fallo, no un marcador de posición.
- [x] **B2.3** Correr `enlaces` → 0 enlaces rotos.
- [x] **B2.4** Commit.

### Tarea B3: panel de cierre

**Archivos:** Crear `src/components/senal/cierre.tsx`

- [x] **B3.1** Panel lima con etiqueta, h2, entrada, botón invertido a
  `/contact`, vías directas en mono y los relojes en tinta.
- [x] **B3.2** Correo y WhatsApp salen de `messages`, no del código, para que
  se cambien sin tocar componentes.
- [x] **B3.3** Commit.

---

## Fase C — El home pasa a `[locale]`

### Tarea C1: la cáscara

**Archivos:** Modificar `src/app/[locale]/layout.tsx`

- [x] **C1.1** Cambiar Inter por Archivo + IBM Plex Mono + Instrument Serif.
- [x] **C1.2** Importar `@/styles/senal.css`; `body` con clase `senal`.
- [x] **C1.3** Quitar `ThemeProvider` **solo aquí**; comprobar que
  `src/app/admin/layout.tsx` lo tiene por su cuenta y añadirlo si no.
- [x] **C1.4** Sustituir `Header`/`Footer` por `Barra`/`Pie`.
- [x] **C1.5** `npm run build` → compila; `/es/about` sale con la tipografía
  nueva aunque el diseño interior siga siendo el viejo (es lo esperado).
- [x] **C1.6** Commit.

### Tarea C2: mover la landing

**Archivos:** Modificar `src/app/[locale]/page.tsx`; borrar `src/app/nuevo/page.tsx` y `layout.tsx`; crear `src/app/nuevo/page.tsx` (redirección)

- [x] **C2.1** `[locale]/page.tsx` compone hero + servicios + testimonios +
  herramientas + cierre, con `id` en cada sección.
- [x] **C2.2** `src/app/nuevo/page.tsx` → `redirect('/')`.
- [x] **C2.3** Quitar `robots: noindex` y poner metadatos y Open Graph reales.
- [x] **C2.4** Manejo del hash: en `servicios.tsx`, tras el `ScrollTrigger.refresh()`
  inicial, si `location.hash` coincide con una sección, hacer `scrollIntoView`.
- [x] **C2.5** Correr `anclas` → `/es#servicios` deja la sección arriba.
- [x] **C2.6** Correr `alcanzabilidad` y `render`.
- [x] **C2.7** Commit.

### Tarea C3: sacar el texto del home a `messages`

- [ ] **C3.1** Namespace `senal` con `hero`, `servicios`, `testimonios`,
  `herramientas`, `cierre`. Solo **es** en esta fase.
- [ ] **C3.2** Los datos que hoy viven en `src/lib/nuevo/*.ts` conservan su
  forma; lo que se traduce son los textos, con la clave como identificador.
- [ ] **C3.3** Correr `render` → los textos siguen saliendo.
- [ ] **C3.4** Commit.

---

## Fase B-bis — Correcciones sobre lo entregado

- [x] **Bb1** La barra cortaba «construimos» por la mitad. `--alto-barra` pasa a
  ser ficha y el hero aparta su primera palabra con
  `max(2%, calc(var(--alto-barra) + 0.5rem))`.
- [x] **Bb2** Oráculo `barra-tapa.mjs`, probado roto. Cubre el punto ciego de
  `alcanzabilidad`: el texto con `pointer-events: none` es invisible a
  `elementFromPoint`.
- [x] **Bb3** Carrete: la central sube y las laterales bajan (contramovimiento).
- [x] **Bb4** Carrete: avance solo cada 3 s, detenido con ratón encima, con el
  foco dentro, fuera de pantalla y con `prefers-reduced-motion`; `aria-live`
  apagado mientras gira solo.

---

## Fase D — Nosotros

**Archivos:** Reescribir `src/components/about-page.tsx`; crear
`src/components/senal/nosotros/{apertura,proposito,principios,equipo,resultados}.tsx`

- [ ] **D1** Preparar retratos: `Victor.png` (1,8 MB) y `Karen.jpeg` a WebP
  800×1000 con sharp → `public/nuevo/equipo/`.
- [ ] **D2** Apertura (verde) con banda en duotono.
- [ ] **D3** Misión y visión (hueso), dos columnas con acento en Instrument.
- [ ] **D4** Principios (niebla), tres columnas con filete lima, **sin numerar**.
- [ ] **D5** Equipo (azul): retratos en duotono que vuelven a color al pasar el
  ratón; con `prefers-reduced-motion` salen ya a color.
- [ ] **D6** Resultados (verde) **con las cifras corregidas**: 10 → 22
  colaboradoras · 27 h/semana · crecimiento relativo · 1 → 6 ciudades.
  Actualizar `about.t_limpia_*` en los tres idiomas: fuera «+37 % utilidades» y
  «12 → 19 empleados».
- [ ] **D7** Cierre.
- [ ] **D8** Oráculos `contraste`, `alcanzabilidad`, `render`. Capturas 1440 y 390.
- [ ] **D9** Commit.

---

## Fase E — Blog

- [ ] **E1** Generar cinco portadas abstractas en colores SEÑAL con Codex, una
  por categoría → `public/nuevo/blog/portada-<categoria>.webp`. Coste 0.
- [ ] **E2** Añadir `image?` al frontmatter y a `src/lib/blog.ts`, con la
  portada de la categoría como valor por defecto.
- [ ] **E3** Listado (`blog-list.tsx`): apertura verde, filtros mono, artículo
  destacado ancho, rejilla de tarjetas sobre hueso.
- [ ] **E4** **Estado vacío por idioma** — hay 0 artículos en alemán: panel que
  lo dice y ofrece la lista en otro idioma. Verificar en `/de/blog`.
- [ ] **E5** Artículo: cabecera, portada en duotono, cuerpo a 68 caracteres,
  **enlaces en verde con subrayado lima**, citas en Instrument, índice pegajoso.
- [ ] **E6** Relacionados y botones de compartir en SEÑAL.
- [ ] **E7** Oráculos + capturas. Commit.

---

## Fase F — Contacto

- [ ] **F1** Dos columnas sobre verde; formulario con anillo de foco lima.
- [ ] **F2** Conservar `?interes=` rellenando el mensaje.
- [ ] **F3** Estado enviado: panel lima «Recibido. Respondemos en 24 h.»
- [ ] **F4** Panel niebla «Qué pasa después», tres pasos **numerados**.
- [ ] **F5** Verificar el envío real a Formspree una vez.
- [ ] **F6** Oráculos + capturas. Commit.

---

## Fase G — Servicios (recortable)

- [ ] **G1** Apertura, cuatro servicios en paneles alternos, proceso numerado,
  producto estrella, filosofía de precio, cierre.
- [ ] **G2** Enlazar desde el panel de cierre del recorrido horizontal del home.
- [ ] **G3** Oráculos + capturas. Commit.

---

## Fase H — Inglés y alemán

- [ ] **H1** Traducir el namespace `senal` a en y de.
- [ ] **H2** Revisar los textos existentes que cambiaron (about, footer, nav).
- [ ] **H3** Correr `paridad-i18n` → 0 huecos.
- [ ] **H4** Recorrer las cinco rutas en los tres idiomas con `render` y
  `alcanzabilidad`: el alemán es el idioma largo y es donde revientan los
  titulares. Capturas de los desbordes.
- [ ] **H5** Commit.

---

## Fase I — Rendimiento y cierre

- [ ] **I1** Pasar a WebP lo que queda: `profile.png` y `victor-profile.png`
  (1,7 MB cada uno).
- [ ] **I2** Vídeo: `preload="none"` en todo lo que no sea el hero; comprobar
  que el póster es el primer fotograma; medir si hace falta una versión ligera
  del hero para móvil.
- [ ] **I3** Lighthouse móvil en el home; anotar LCP, CLS y peso total.
- [ ] **I4** Probar en Safari: la máscara del carrete y el pin horizontal son lo
  que más falla ahí.
- [ ] **I5** Correr los seis oráculos de una vez con `correr.sh`.
- [ ] **I6** Commit final. **Parar.** Push, previsualización y merge se piden
  aparte.

---

## Antes de publicar (no es código)

1. Volver de `TESTIMONIOS_DUMMY` a `TESTIMONIOS` en `src/components/nuevo/testimonios.tsx`.
2. Fotos reales de Deisy, Laura y Nadia; las palabras de Nadia, textuales.
3. Correo y WhatsApp definitivos.
4. Textos legales, o el pie se queda sin esa columna.
