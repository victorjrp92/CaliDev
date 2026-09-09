# SEÑAL para todo el sitio — especificación

**Estado:** propuesta · 2026-09-09 · rama `feat/hero-senal`
**Origen:** la landing nueva (`/nuevo`) está cerrada y aprobada. Falta llevar su
lenguaje visual al resto del sitio y reemplazar el home.

---

## 1. Problema

Hoy conviven dos sitios en el mismo repo:

| | Landing nueva (`/nuevo`) | Sitio actual (`/[locale]/*`) |
|---|---|---|
| Tipografía | Archivo · IBM Plex Mono · Instrument Serif | Inter |
| Color | SEÑAL (verde/lima/azul/niebla/hueso/tinta) | tokens shadcn, claro y oscuro |
| Tema | uno solo, comprometido | conmutador sol/luna |
| Idiomas | solo español, texto en los componentes | ES/EN/DE con next-intl |
| Cabecera | ninguna | `header.tsx`, 190 líneas |

Publicar la landing tal cual dejaría un sitio partido por la mitad: se sale del
home y cambia la tipografía, el color y el tema.

## 2. Objetivo

Un solo sitio en SEÑAL: home, nosotros, blog, contacto y servicios, con barra
y pie propios, en tres idiomas, con el home actual reemplazado.

## 3. Decisiones

**D1 · SEÑAL se convierte en la cáscara de `[locale]`, no en un grupo aparte.**
Como se rediseñan *todas* las páginas públicas, un grupo de rutas paralelo solo
añadiría una capa que habría que borrar después. `[locale]/layout.tsx` pasa a
cargar las tres fuentes y `senal.css`. `/nuevo` queda como redirección a `/`.

**D2 · Un solo tema. Se retira el conmutador claro/oscuro de las páginas
públicas.** SEÑAL es una identidad comprometida: el verde es la marca, no una
preferencia. Mantener dos temas duplica el trabajo de diseño de cinco páginas y
obliga a definir cada panel dos veces. `next-themes` se queda solo en `/admin`,
que es una herramienta interna y sí se agradece en oscuro.
*Riesgo asumido:* quien tenga el sitio en oscuro verá el cambio. Es un rediseño
completo; ya lo iba a notar.

**D3 · «Servicios» en la barra es un ancla del home, no la página.**
`/#servicios` salta directo a la sección y se salta el hero, que es lo pedido.
La página `/services` sigue existiendo como el detalle (precios, proceso,
producto estrella) y se alcanza desde el panel de cierre del recorrido
horizontal. Embudo: vistazo en el home → detalle en la página.

**D4 · La barra es cristal, siempre puesto, y el hero se aparta de ella.** Los paneles cambian de fondo
todo el rato (hueso, verde, niebla, azul, lima). Una barra sólida chocaría con
la mitad; un velo verde translúcido con desenfoque se lee como un mismo objeto
sobre todos y mantiene el texto hueso por encima de 4,5:1 sobre cualquiera de
ellos, porque el velo domina la mezcla. El velo no se quita nunca: quitarlo arriba del
todo dejaba el texto hueso invisible sobre el hero, que arranca en hueso, y
bajar la opacidad tampoco vale (al 55 % el contraste cae a 4,2:1). Lo que entra
con el scroll es el filete inferior. Y como la barra flota sobre el contenido,
su alto es una ficha (`--alto-barra`) que el hero usa para apartar su primera
palabra — con el 2 % original, «construimos» salía cortada por la mitad.

**D5 · Sin gasto nuevo en kie.ai.** Las imágenes que faltan (portadas de blog,
texturas) se generan con Codex, que no cuesta. Los tres clips que ya tenemos se
reutilizan. Si alguna sección pide movimiento nuevo, se pregunta antes.

**D6 · Las cifras de LimpiaExpress en «Nosotros» están mal y hay que
corregirlas.** El texto actual dice *«nuestras utilidades crecieron 37 %»* y
*«de 12 a 19 empleados»*. Victor indicó que las cifras reales son **10 → 22
colaboradoras** y que **los ingresos y las utilidades no se publican**
(«es muy personal, Colombia es un país delicado»). Se sustituyen por
crecimiento relativo y cifras de plantilla y horas.

## 4. Sistema de diseño

### 4.1 Fichas de color

Las seis de SEÑAL, más tres de estructura:

```
--verde-hondo: #072a20   /* pie de página: una capa por debajo del verde */
--linea:       rgba(250,250,247,.14)   /* filete sobre oscuro */
--linea-tinta: rgba(20,32,27,.12)      /* filete sobre claro */
--cristal:     rgba(10,61,46,.78)      /* velo de la barra */
```

**Regla del lima, que no cambia:** contraste lima/hueso 1,5:1. El lima nunca
lleva texto sobre fondo claro. Vive como relleno con tinta encima, como acento
sobre verde o azul, o como filete. El color de texto sobre claro es el verde.

### 4.2 Fondos y ritmo

Cada página es una pila de paneles a sangre. Dos reglas:
- nunca dos paneles seguidos con el mismo fondo;
- el lima solo como panel terminal (el cierre), porque grita.

Orden habitual: `verde → hueso → niebla → azul → verde → lima`.

### 4.3 Tipografía

| Papel | Fuente | Tamaño | Peso | Tracking |
|---|---|---|---|---|
| Display | Archivo | `clamp(2.6rem,7vw,6rem)` | 800 | −0.04em |
| h2 | Archivo | `clamp(2.2rem,5.5vw,4.4rem)` | 800 | −0.035em |
| h3 | Archivo | `clamp(1.35rem,2.6vw,2rem)` | 600 | −0.02em |
| Cuerpo | Archivo | 1.0625rem / 1.7 | 400 | — |
| Entrada | Archivo | `clamp(1.05rem,1.6vw,1.25rem)` / 1.65 | 400 | — |
| Etiqueta | Plex Mono | 11.5px | 400 | 0.14em, versales |
| Acento | Instrument Serif itálica | hereda | 400 | — |

Medida del texto corrido: 65–68 caracteres. Titulares con `text-wrap: balance`.

### 4.4 Piezas compartidas (una por archivo)

| Archivo | Papel |
|---|---|
| `src/components/senal/panel.tsx` | Sección a sangre con fondo, `id` y márgenes constantes |
| `src/components/senal/titular.tsx` | Etiqueta mono + h2 + entrada |
| `src/components/senal/boton.tsx` | Primario (lima/tinta), secundario (filete), invertido para fondo lima |
| `src/components/senal/duotono.tsx` | Imagen en gris con fuga de luz lima — el mismo tratamiento del carrete |
| `src/components/senal/relojes.tsx` | Los tres husos, extraído del hero |
| `src/components/senal/barra.tsx` | Barra superior de cristal |
| `src/components/senal/pie.tsx` | Pie de página |
| `src/components/senal/cierre.tsx` | Panel lima de cierre, compartido por todas las páginas |

`duotono` y `relojes` salen de código que ya existe en el hero y en el carrete
de testimonios: se extraen, no se reescriben.

## 5. Diseño por página

### 5.1 Barra superior

Fija arriba, 4rem en móvil y 5rem en escritorio. Rejilla: logo · enlaces · acciones.

- **Arriba del todo** (`scrollY < 24`): fondo transparente, sin filete.
- **Con scroll**: `background: var(--cristal)`, `backdrop-filter: blur(16px) saturate(1.2)`, filete inferior `var(--linea)`.
- Enlaces en mono versales, hueso al 72 %; el activo al 100 % con un punto lima.
  En el home, «Servicios» se marca activo mientras la sección está a la vista.
- Botón «Agendar una llamada»: relleno lima, texto tinta, píldora.
- Idiomas EN · ES · DE en mono; el activo en lima.
- Logo: `brand/logo-calidev.svg`, relleno hueso.
- **Móvil**: hamburguesa → capa completa en verde, enlaces en Archivo 2.5rem,
  los relojes abajo. Cierra con la X o con Escape, con foco atrapado dentro.

### 5.2 Home

Lo que ya está, más:
- anclas `#servicios`, `#testimonios`, `#herramientas` con `scroll-margin-top: 5rem`;
- **manejo del salto por hash**: la sección horizontal está fijada con
  ScrollTrigger y cambia el alto total de la página *después* de medir, así que
  el salto nativo del navegador cae en el sitio equivocado. Al montar, si hay
  hash: esperar a `ScrollTrigger.refresh()` y entonces `scrollIntoView`;
- panel de **cierre** antes del pie.

### 5.3 Cierre (compartido)

Fondo lima, texto tinta.
- Etiqueta: «El siguiente paso».
- h2: «Cuéntanos qué se está rompiendo.»
- Entrada: qué pasa después — respuesta en 24 h, sin compromiso.
- Botón primario invertido (relleno tinta, texto lima) → `/contact`.
- Vías directas en mono: correo y WhatsApp.
- A la derecha, los tres relojes en tinta: estamos en tres husos.

### 5.4 Pie de página

Fondo `--verde-hondo`.
- Fila 1: logo + lema, con una palabra en Instrument itálica.
- Columnas: Servicios · Empresa · Legal.
- Fila 2: relojes, idiomas, copyright, iconos sociales.
- Filetes en `--linea`.

**Pendiente que bloquea el pie:** las claves `footer.privacy` y `footer.terms`
existen pero **no hay rutas** `/privacy` ni `/terms`, y el sitio se dirige
también a Alemania, que exige Impressum y Datenschutzerklärung. Son textos con
efecto legal: no se inventan. Hasta que Victor dé el texto, esos enlaces **se
omiten** en vez de dejarlos rotos.

### 5.5 Nosotros

| # | Fondo | Contenido |
|---|---|---|
| 1 | verde | Etiqueta «Nosotros» · h1 «Estrategia de negocio e ingeniería, bajo el mismo techo.» · entrada. Banda ancha con un fotograma del hero en duotono. |
| 2 | hueso | Misión y visión a dos columnas, con una palabra en Instrument itálica en cada una y un filete entre ambas. |
| 3 | niebla | «Cómo trabajamos»: los tres principios a tres columnas, cada uno con filete lima arriba. **Sin numerar** — son principios, no una secuencia. |
| 4 | azul | «Quiénes somos»: Victor y Karen en dos retratos grandes en duotono; al pasar el ratón vuelven a color. Nombre en Archivo, papel en mono lima, biografía en cuerpo. |
| 5 | verde | Resultados: cifras grandes en Archivo con etiquetas en mono. **Datos corregidos** (ver D6): 10 → 22 colaboradoras · 27 h/semana recuperadas · crecimiento relativo · 1 → 6 ciudades para 2027. Sin cifras de ingresos ni de utilidades. |
| 6 | lima | Cierre. |

### 5.6 Blog — listado

- Apertura en verde con etiqueta, h1 y entrada.
- Filtros por categoría: fichas mono, la activa con relleno lima y texto tinta.
- El artículo más reciente ocupa una tarjeta ancha con portada grande.
- El resto, rejilla de tarjetas sobre hueso: portada, ficha de categoría,
  título en Archivo 600, fecha y minutos en mono, extracto. Al pasar el ratón
  la portada escala un punto y crece un filete lima bajo el título.
- **Portadas**: se añade `image` al frontmatter. Cinco portadas abstractas en
  colores SEÑAL, una por categoría, generadas con Codex. Un artículo sin
  portada propia usa la de su categoría.
- **Estado vacío por idioma**: hoy hay 4 artículos en inglés, 1 en español y
  **0 en alemán** — `/de/blog` sale en blanco. Hace falta un panel que lo diga y
  ofrezca la lista en otro idioma.

### 5.7 Blog — artículo

- Cabecera: ficha de categoría, h1 (máx. 20 caracteres de ancho), fecha ·
  autor · minutos en mono, portada a sangre en duotono.
- Cuerpo a 68 caracteres, Archivo 1.125rem / 1.75.
  - **Enlaces en verde con subrayado lima** — el lima como texto sobre hueso no
    pasa contraste.
  - Citas: Instrument itálica grande en verde con filete lima a la izquierda.
  - Código: Plex Mono sobre niebla.
- Índice pegajoso en la columna izquierda (escritorio), en mono; la sección
  activa en verde con punto lima.
- Botones de compartir y tres artículos relacionados.
- Cierre en lima.

### 5.8 Contacto

- Dos columnas sobre verde.
  - Izquierda: h1, entrada, los tres relojes, y las vías directas (correo,
    WhatsApp) en mono.
  - Derecha: formulario sobre una tarjeta un punto más clara. Campos con fondo
    hueso al 8 %, filete, texto hueso y anillo de foco lima. Etiquetas en mono
    versales. Enviar: relleno lima, texto tinta.
- Se conserva `?interes=`, que rellena el mensaje.
- Enviado: el formulario se sustituye por un panel lima con «Recibido.
  Respondemos en 24 h.»
- Debajo, panel niebla «Qué pasa después» con tres pasos **numerados** — aquí
  el número sí es información: es una secuencia.
- El envío sigue yendo a Formspree; no se toca el backend.

### 5.9 Servicios (`/services`) — fase opcional

Apertura en verde, los cuatro servicios en paneles alternos, el proceso en
cuatro pasos numerados (secuencia real), el producto estrella con su precio, la
filosofía de precio y el cierre. **Es la fase que se puede recortar** si se
quiere publicar antes: la nav ya no depende de ella.

## 6. Reglas de contenido

Se mantienen sin cambios:
- Siempre en plural, como equipo; nunca alrededor de Victor.
- Ningún dato real de cliente; las pantallas de ServiNomic son recreaciones con
  datos inventados.
- Cifras de clientes solo relativas; nunca ingresos ni utilidades absolutas.
- Ningún testimonio inventado: sin cita textual, el hueco queda marcado.
- Nada de caras en imágenes generadas (espaldas y perfiles sí).

**Deuda que sigue abierta:** los testimonios del home usan contenido de relleno
(retratos de IA, nombres y citas inventadas). Antes de publicar hay que volver a
`TESTIMONIOS` y tener las fotos reales y las palabras de Nadia.

## 7. Oráculos

Cada uno se prueba **roto a propósito** antes de darlo por bueno; un
verificador que no puede fallar es peor que ninguno.

| Oráculo | Qué caza | Control positivo |
|---|---|---|
| `contraste` | Texto hueso sobre el cristal de la barra compuesto sobre los cinco fondos, y cada par texto/fondo del sitio | Poner lima sobre hueso a propósito |
| `alcanzabilidad` | Contenido tapado por la barra fija o por el pin horizontal: recorre cada ruta y hace `elementFromPoint` sobre cada titular | Subir la barra a 300 px de alto |
| `barra-tapa` | Texto grande cortado por la barra. **No lo cubre `alcanzabilidad`**: la tipografía del hero son `<span>` con `pointer-events: none`, así que `elementFromPoint` nunca la devuelve — un oráculo de impacto es ciego justo a la letra más grande de la página. Este mide geometría | Devolver la palabra del hero a `top: 2%` |
| `paridad-i18n` | Claves que faltan o vacías en es/en/de | Borrar una clave |
| `anclas` | `/#servicios` deja la sección a menos de 100 px del borde superior tras asentarse | Quitar el `scroll-margin-top` |
| `enlaces` | Ningún enlace de barra o pie da 404 | Añadir un `/inexistente` |
| `render` | Cada ruta responde 200 y su h1 tiene texto | Vaciar un h1 |

## 8. Fuera de alcance

- `git push`, previsualización en Vercel y merge a `main`: los tres se piden
  aparte. Todo queda en local.
- El panel `/admin` y las rutas `/pay`, `/receipt`, `/servinomic`: no se tocan.
- Textos legales (privacidad, términos, Impressum): los da Victor.
- Traducir los artículos del blog que faltan: es redacción, no maquetación.

## 9. Lo que hace falta de Victor

1. Fotos reales de Deisy, Laura y Nadia.
2. Las palabras de Nadia sobre su página, textuales.
3. Confirmar si Supabase se usa, para incluirlo o no en las órbitas.
4. Correo y número de WhatsApp que van en el cierre y en el pie.
5. Texto legal, o permiso para dejar el pie sin esa columna.
6. Si se recorta la fase de `/services`.
