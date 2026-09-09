# Claridad del mensaje — spec de implementación

**Origen:** un lector externo abrió calidev.dev y dijo: *«Básica bien normal. No
entendí qué quisieron comunicar. O sea si que si tienen un problema se
contacten. ¿Problemas de qué?»* Al preguntarle más, aclaró que **el diseño le
gustó**; lo que no entendió es de qué trata la página.

**Regla que gobierna todo este spec:** no se toca el diseño. Ni la tipografía
cinética, ni el recorrido horizontal, ni la animación, ni la paleta. Solo cambia
**qué texto es grande, qué texto existe y qué texto se queda en pantalla.**

---

## Lo medido, no lo opinado

Tres hechos, tomados del sitio en producción:

1. **Sobre el pliegue en móvil se leen cuatro palabras:** «ES · construimos tu
   ventaja». **Cero sustantivos concretos** — ni software, ni aplicaciones, ni
   sitio web, ni pymes. En escritorio se añaden el menú y los relojes, y sigue
   sin haber ninguno.

2. **La jerarquía del panel de servicios está invertida.** El nombre del
   servicio va a **12 px**; la frase de filosofía, a **70 px**. Seis veces más
   grande. Y tres de los cuatro titulares grandes **no contienen ni un
   sustantivo del negocio**: las palabras «app», «CRM», «sistema» y
   «automatización» solo existen en la línea de 12 px.

3. **El título de la sección desaparece en el segundo paso** y no vuelve. A
   partir de ahí no queda nada en pantalla que diga que eso es una lista de
   servicios — que es exactamente «no sé qué estoy leyendo».

Y un cuarto, del propio pantallazo del lector: **la tarjeta de WhatsApp explica
el negocio mejor que la página**. La descripción para buscadores ya dice
«analizamos la operación, encontramos dónde se pierde tiempo y dinero, y
construimos el sistema que lo arregla». Ese trabajo lo hace el metadato, no el
hero.

---

## Cambio 1 — El hero dice de qué va esto

Una línea nueva, debajo de «construimos» y encima del vídeo:

> **Consultoría de negocio y software a medida para pymes. Cali · Frankfurt · Sídney.**

Elegida entre tres opciones. Es la menos vistosa y la que menos falla el test de
los cinco segundos: nombra qué se hace (consultoría y software a medida), para
quién (pymes) y dónde. Los tres husos dejan de ser un adorno y pasan a
significar algo.

**Restricciones:**
- Va en mono, el mismo estilo que ya usan los relojes. No introduce ningún
  recurso tipográfico nuevo.
- Vive dentro del grupo que se desvanece con el scroll, así que desaparece con
  las palabras. No compite con el vídeo expandido.
- **Tiene que caber en el primer pantallazo de un móvil de 390 px**, que es donde
  hoy solo se leen cuatro palabras. Se verifica midiendo, no mirando.
- En verde sobre hueso: 11,7:1.
- No se toca «construimos tu ventaja». Sigue siendo el eslogan visual.

## Cambio 2 — Se invierte la jerarquía del panel

De esto:

```
01 · Estrategia digital                          ← 12 px
Empezamos por tu operación, no por el código.    ← 70 px
```

A esto:

```
Servicios · 01 de 04                             ← 12 px, marco
Estrategia digital                               ← titular
Empezamos por tu operación, no por el código.    ← entradilla
```

El nombre del servicio pasa a ser el titular. La frase de filosofía no se pierde
ni se acorta: baja un escalón y pasa a ser la entradilla, que es el papel que le
corresponde. **No se reescribe ni una palabra de los cuatro paneles** — solo
cambian de tamaño.

## Cambio 3 — Un marco que no se va

Cada panel abre con `Servicios · 01 de 04`. Como cada panel ocupa la pantalla
entera, ese rótulo está siempre visible durante todo el recorrido: siempre se
sabe que se está leyendo servicios y cuánto falta.

**Esto sustituye a la tercera propuesta** («que el panel de entrada sobreviva»).
Con el contador en cada panel, el marco ya no depende del panel de entrada, así
que fijar el título de la sección sería un segundo mecanismo para el mismo
efecto. Se hace el barato.

---

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/ui/work-page-hero.tsx` | Prop nueva para la línea; se pinta bajo la primera palabra |
| `src/app/[locale]/page.tsx` | Pasa la línea desde `messages` |
| `src/components/nuevo/servicios.tsx` | Invierte la jerarquía y añade el contador |
| `messages/{es,en,de}.json` | `senal.hero.linea` y `senal.servicios.marco` |

## Verificación — qué tiene que ser cierto al terminar

1. **Sobre el pliegue en móvil aparece al menos un sustantivo concreto.** Es la
   prueba que hoy falla y la razón de todo el spec. Se mide con el mismo guion
   que la detectó.
2. La línea nueva entra en el primer pantallazo de 390 px sin desbordar.
3. En cada panel, el nombre del servicio es **más grande** que la frase de
   filosofía. Se comprueba comparando tamaños calculados, no de vista.
4. `Servicios · N de 04` está en pantalla en los cuatro pasos del recorrido.
5. Los ocho oráculos siguen pasando, con la paridad de los tres idiomas.
6. El texto de los cuatro paneles es idéntico al de antes, palabra por palabra.

## Fuera de alcance

- Reescribir el cuerpo o los puntos de los paneles.
- Tocar el recorrido horizontal, el pin, o la animación.
- Cambiar «construimos tu ventaja».
- El resto de ideas de la auditoría (subir la prueba numérica, nombrar sectores
  de cliente). Quedan anotadas, no entran aquí.

## Reversión

Todo va en **un solo commit**. Si no convence, `git revert` de ese commit lo
deja exactamente como estaba.

---

# Segunda tanda — crítica editorial externa

Un segundo lector hizo una revisión editorial completa. Verifiqué sus cuatro
afirmaciones comprobables y **las cuatro eran ciertas**:

1. **La página se contradecía sobre qué son los servicios.** «Cuatro *maneras* de
   trabajar juntos» (alternativas) + «**Siempre en ese orden**: primero
   entender, después construir» (secuencia obligatoria) + «¿Cuál de las cuatro
   es la tuya?» (menú otra vez). Nadie podía saber si se contrata una web suelta
   o hay que pasar por todo. **Esto no lo había detectado yo.**
2. **Dos cifras para el mismo dato:** «más de 20 horas por semana» en el panel de
   automatizaciones contra «27 horas a la semana» en el testimonio de Deisy.
3. «Si no nos necesitas, te lo decimos» aparecía dos veces en el sitio vivo.
4. **El hero no tenía ninguna llamada a la acción.** Cero enlaces.

## Lo aplicado

- **Hero:** línea nueva que nombra los entregables y a quién sirven, más un botón
  «Ver qué podemos hacer» que lleva al recorrido. La línea va en texto normal y
  no en el mono versal del resto de rótulos: cien caracteres en versales
  espaciadas ocupan cuatro líneas y se leen peor.
- **Colocación por ancho.** En móvil, centrada bajo la primera palabra; en
  escritorio se va a la franja izquierda, porque la píldora de vídeo ocupa el
  centro desde el 18 % y ahí no hay hueco. El ancho del bloque se ata al mismo
  22 % que usa la píldora, así que no puede invadirla si algo cambia.
- **La píldora baja en móvil** de `top: 27%` a `36%`, conservando su altura
  (46 % de la pantalla): sin eso, el botón caía encima del vídeo.
- **El botón vive fuera del grupo de las palabras**, que lleva
  `pointer-events: none` para no robarle el ratón al vídeo — dentro de él un
  enlace sería imposible de pulsar. Se desvanece con la misma línea de tiempo.
- **Se deshace la contradicción:** fuera «siempre en ese orden». El rótulo
  `Servicios · 01 de 04` se lee como paginación, no como pasos.
- **El panel de entrada nombra los cuatro** antes del recorrido.
- **Renombrados:** «Estrategia digital» → «Diagnóstico y plan de mejora»;
  «Apps y CRMs» → «Aplicaciones y sistemas a medida», porque «CRM» exige saber
  ya qué es un CRM.
- **Páginas web:** la entradilla dice primero para qué sirve la web y después
  que se actualiza sola.
- **El cierre deja de presuponer una crisis:** «¿Qué quieres crear o mejorar?»
  en vez de «Cuéntanos qué se está rompiendo» — quien necesita su primera web no
  se reconocía en la anterior.

## Las dos preguntas que quedaron sin respuesta, y cómo se resolvieron

**20 h o 27 h.** Se unifica en **27 h**, que es la cifra respaldada por el
testimonio de Deisy. Si el «más de 20» era una medición aparte, solo de las
automatizaciones, hay que restaurarla. **Pendiente de confirmación de Victor.**

**«Sin suscripciones ni ataduras».** No consta qué paga el cliente en dominio y
alojamiento, así que **no se afirma que sean gratis**: la promesa se precisa a
«el código y los accesos, sin cuota mensual nuestra», que es cierto sin saber el
resto. Si tampoco hay coste de alojamiento, puede decirse — pero hay que
saberlo antes. **Pendiente de confirmación de Victor.**

## Lo que NO se hizo, y por qué

**No se reordenan los servicios con el diagnóstico al final.** Era la sugerencia
más fuerte de la crítica y es la que se rechaza: todo el sitio argumenta
«empezamos por tu operación, no por el código», y dejar el análisis de último lo
convierte en un extra opcional. El problema que detectó —la numeración sugería
pasos obligatorios— era real, pero se arregla quitando el marco de secuencia,
no invirtiendo el argumento.

**No se quita la repetición de «si no nos necesitas, te lo decimos».** Es la
misma promesa en dos contextos distintos: un punto dentro de un servicio y un
principio en Nosotros. Quitar cualquiera de las dos debilita una sección a
cambio de muy poco.

**No se bajan más las herramientas.** Ya están al final, después de los
testimonios.

**No se toca la cita del testimonio antiguo** que menciona 20 horas. Son las
palabras de alguien; se recortan, no se corrigen.
