# calidev.dev/social — spec de diseño

**Qué es:** el centro de operaciones de Instagram de Calidev. Un panel en
`calidev.dev/social` que reúne todas las publicaciones de @calidevdev, y un
agente que responde comentarios y mensajes directos de forma automática las 24
horas, sin depender del Mac de Victor.

**Origen:** el 27 sep 2026 se construyó y probó un agente local (Python + n8n en
el Mac, `~/Documents/Projects/ig-agente/`) para el video testimonial de Deisy
(LimpiaExpress). Funciona, pero solo mientras el Mac está prendido, y su panel
solo abre en el Mac. Victor aprobó llevarlo todo a calidev.dev, pensado para
todas las publicaciones futuras, no para una campaña.

**Diseño visual aprobado:** artifact *Calidev Social*
(https://claude.ai/artifact/1UKWtmg7e8SVFankdy41tq), página «Centro de
operaciones». Ese lienzo es la referencia de UI; este documento es la de
comportamiento.

---

## 1. Criterio de cierre

El trabajo **no está terminado** hasta que se cumplan las cuatro condiciones.
Cada una tiene su prueba.

| # | Condición | Cómo se prueba |
|---|---|---|
| C1 | `calidev.dev/social` en producción, con login propio y las 5 pantallas del diseño (Inicio, Publicación con «Video y gancho», Chats, Automatización, móvil) mostrando **datos reales**, no de ejemplo. | Recorrido con Playwright en 1440 px y 390 px sobre producción; cada pantalla con al menos un dato real verificable contra Instagram. |
| C2 | Instagram se responde solo **con el Mac apagado**. | Una cuenta que nunca le escribió a @calidevdev comenta «ayuda» en una publicación automatizada. En ≤ 2 min: respuesta pública + mensaje privado con 3 botones; al tocar «Sí, tengo negocio», texto + tarjeta con la landing. Registro en el panel. |
| C3 | El embudo se cierra con datos reales: comentario → mensaje → visita a la landing → pasos del formulario, ligado a la persona. | Esa misma cuenta abre la tarjeta y llena el paso 1: su ficha en Chats muestra visita, desplazamiento y paso alcanzado. |
| C4 | El agente local se retira. | `launchctl list` sin `dev.calidev.*`; n8n desinstalado o apagado; el panel sigue respondiendo. |

---

## 2. Decisiones tomadas (con Victor, 27 sep 2026)

1. **Automático solo para quien entra por un comentario** en una publicación
   automatizada. Los mensajes directos espontáneos **no** se responden solos:
   se ven en Chats y los responde Victor desde el panel.
2. **Todo en Vercel**, dentro del proyecto `cali-dev`. El agente se reescribe en
   TypeScript; n8n sale del sistema.
3. **Plan Hobby de Vercel + reloj externo gratuito** (cron-job.org) que llama cada
   minuto. Vercel Cron en Hobby corre solo una vez al día.
4. **Login separado** para `/social` (no el de `/admin`), con el patrón de
   `src/lib/panel-leads.ts`.
5. **Mapa de calor propio**, no Microsoft Clarity: permite ligar cada visita a la
   persona de Instagram y deja los datos en Postgres. Clarity queda como opción
   futura para grabaciones de sesión.
6. **Clasificación con Jev** (umbral 0,7), **redacción con DeepSeek**
   (`deepseek-chat`), **análisis de video con Gemini**. No se usa la API de
   Anthropic.
7. **Sin acento caleño** en los textos hasta que Victor los personalice.
8. Los textos, enlaces y el flujo de cada publicación se **editan desde el panel**
   (fase 4); los valores iniciales son los probados en el agente local.

**Fuera de alcance:** responder mensajes directos espontáneos; grabaciones de
sesión; webhook de Meta (requiere revisión de la app); otras redes sociales;
varios usuarios con roles; entrenar Laya (se habilita la recogida de
correcciones, el entrenamiento es otro proyecto).

---

## 3. Arquitectura

```
cron-job.org ──cada minuto──► POST /api/social/ciclo   (cabecera secreta)
                                   │
            src/lib/social/ciclo.ts: candado → comentarios → mensajes → salida
                                   │
      ┌──────────────┬─────────────┼──────────────┬──────────────┐
  composio.ts     instagram.ts   jev.ts        redactor.ts    db.ts (Postgres)
  (MCP HTTP)      (operaciones)  (TypeSafe)    (DeepSeek)     tablas social_*

/social/*  (páginas, login propio) ──► /api/social/* ──► mismas librerías
landings /servinomic/* ──► <SeguimientoSocial/> ──► POST /api/social/t (visitas)
Gemini ◄── /api/social/video (análisis bajo demanda)
```

Principios:
- **Ninguna página del panel llama a Composio.** Cada llamada cuesta 3-5 s; Chats leía la bandeja en vivo y tardaba 8-9 s. La bandeja se copia en `social_conversaciones` desde el reloj (cada 10 min, o cada ciclo si hay personas esperando) y con el botón «Actualizar». Medido en la vista previa tras el cambio: todas las pantallas < 1,1 s.
- **Una ejecución = un ciclo corto.** Máximo 6 acciones de escritura por
  ejecución y sin `sleep`: el espaciado entre respuestas lo da el reloj. Lo que no
  cupo queda para el minuto siguiente.
- **La base de datos es la fuente de verdad.** Toda decisión se registra antes
  de responder en Instagram, en dos pasos (reservar → publicar → confirmar), para
  que un corte a mitad no provoque respuestas dobles.
- **La lógica pura no toca la red:** decidir la acción, reconocer botones,
  calcular la frecuencia y armar enlaces son funciones puras con pruebas propias.

### 3.1 Módulos (`src/lib/social/`)

Un archivo por responsabilidad. Los marcados (puro) no importan nada con red ni
base de datos y se prueban con `node --test`.

| Archivo | Responsabilidad |
|---|---|
| `composio.ts` | Cliente MCP por HTTP: `initialize` → `mcp-session-id` → `tools/call`. `herramienta(slug, args)` y `proxy(método, url, body, query)` vía `COMPOSIO_REMOTE_WORKBENCH`. Reabre la sesión si caduca. |
| `instagram.ts` | Operaciones: publicaciones (con `comments_count`), comentarios, responder comentario, respuesta privada con botones, enviar texto, enviar tarjeta, conversaciones, mensajes, métricas de un reel, descargar el video. |
| `jev.ts` | Clasificar comentario (6 tipos) y respuesta libre de mensaje directo (3 ramas). Devuelve `{tipo, confianza}`. |
| `preguntas.ts` (puro) | Las preguntas y definiciones de Jev (copiadas de `ig-agente/preguntas.py`, 47/48 en la prueba). |
| `redactor.ts` | DeepSeek con el estilo de marca; recorta a 290 caracteres. |
| `reglas.ts` (puro) | `decidir(tipo, confianza, configuración)` → acción; `reconocerBoton(texto)`; `siguienteRevision(edad del post)`; `puedeRespuestaPrivada(fecha)`; `ventanaAbierta(último mensaje)`. |
| `enlaces.ts` (puro) | Construye la URL de la tarjeta con UTM y `c=<código de persona>`; valida que el destino sea una landing permitida. |
| `ciclo-comentarios.ts` | Revisa publicaciones activas, trae comentarios nuevos, clasifica, decide, responde y registra. |
| `ciclo-mensajes.ts` | Solo personas del flujo con mensajes posteriores a su entrada: botones, clasificación de texto libre y paso siguiente. |
| `ciclo.ts` | Candado, orden, tope de acciones, resumen y registro de eventos. |
| `metricas.ts` | Métricas por publicación (cada hora) → `social_metricas`. |
| `video.ts` | Análisis con Gemini: transcripción con tiempos, escenas, evaluación del gancho; lectura de la captura de retención. |
| `db.ts` | Esquema `social_*` (creación idempotente) y consultas con nombre. |
| `sesion.ts` | Login del panel: contraseña en tiempo constante, cookie firmada `panel_social` limitada a `/social`, 30 días. |

---

## 4. Modelo de datos (Postgres, prefijo `social_`)

| Tabla | Columnas principales | Notas |
|---|---|---|
| `social_ajustes` | `clave` PK, `valor` | `pausado`, `simulacion`, `ciclo_en_curso_hasta` (candado con caducidad de 90 s). |
| `social_publicaciones` | `media_id` PK, `caption`, `permalink`, `miniatura`, `tipo`, `publicado`, `comentarios_vistos`, `sincronizado` | Espejo de Instagram. |
| `social_automatizaciones` | `media_id` PK/FK, `modo` (automatico · borradores · apagado), `sensible` bool, `activado_en`, `apagar_en`, `landing_url`, `palabras_clave` text[], `detectar_interes` bool, `umbral` real, `textos` jsonb, `flujo` jsonb, `proxima_revision` | Configuración por publicación. `textos` y `flujo` tienen los valores iniciales del agente local. |
| `social_comentarios` | `id` PK, `media_id`, `usuario`, `igsid`, `texto`, `ts`, `tipo`, `confianza`, `accion`, `respuesta`, `estado`, `error`, `tipo_corregido`, `me_gusta` | `estado`: reservado · respondido · simulado · revision · alerta · descartado · error. |
| `social_personas` | `igsid` PK, `usuario`, `codigo` único (para `?c=`), `media_id` de origen, `comment_id`, `paso`, `rama`, `desde`, `ultimo_mensaje_de_ella`, `etiquetas` text[], `nota` | Una persona entra al flujo una sola vez. |
| `social_mensajes` | `id` PK, `igsid`, `texto`, `nuestro` bool, `ts`, `origen` (agente · victor · persona), `accion`, `estado`, `borrador` | Incluye los mensajes enviados desde el panel. |
| `social_metricas` | `media_id`, `medido_en`, `vistas`, `alcance`, `skip_rate`, `tiempo_promedio_ms`, `guardados`, `compartidos`, `me_gusta`, `comentarios` | Serie temporal, una fila por medición. |
| `social_video` | `media_id` PK, `duracion_s`, `transcripcion` jsonb, `escenas` jsonb, `gancho` jsonb, `curva` jsonb, `caidas` jsonb, `analizado_en` | Resultado de Gemini. `curva` solo si Victor sube la captura. |
| `social_visitas` | `id` PK, `codigo` (persona) nullable, `landing`, `inicio`, `fin`, `dispositivo`, `pais` (cabecera de Vercel), `max_scroll` real, `secciones` jsonb, `paso_formulario` int | Una por visita. |
| `social_clics` | `visita_id`, `selector`, `seccion`, `x_rel`, `y_rel`, `muerto` bool, `rabia` bool, `ts` | Para el mapa de calor por elemento. |
| `social_eventos` | `ts`, `nivel`, `texto`, `media_id` nullable | Alertas y errores visibles en el panel. |
| `social_consumo` | `mes`, `servicio`, `llamadas`, `costo_estimado` | Para la tarjeta de consumo. |

La tabla `leads` existente gana la columna `social_codigo` (nullable) para ligar
el formulario con la persona.

---

## 5. Flujos

### 5.1 Ciclo (cada minuto)

1. Validar la cabecera `Authorization: Bearer $SOCIAL_CRON_SECRET`. Si falla → 401.
2. Tomar el candado (`UPDATE … WHERE ciclo_en_curso_hasta < now()`). Si lo tiene
   otro → responder `ocupado`.
3. Si `pausado` → salir.
4. **Una** llamada para traer las publicaciones con `comments_count`. Solo se leen
   los comentarios de las automatizaciones activas cuya `proxima_revision` ya
   pasó **y** cuyo conteo cambió.
5. Ciclo de comentarios y ciclo de mensajes, compartiendo el tope de 6 acciones.
6. Actualizar `proxima_revision`: cada 1 min las primeras 72 h, cada 15 min hasta
   el día 14 y después `modo = apagado` (con evento visible).
7. Soltar el candado y devolver el resumen.

### 5.2 Comentario nuevo

- Se ignoran: los de @calidevdev, las respuestas a otros comentarios y los
  anteriores a `activado_en`.
- Jev clasifica. Acción según `decidir()`:

| Tipo (confianza ≥ umbral) | Acción |
|---|---|
| felicitación, etiqueta/emoji | Respuesta con DeepSeek. |
| quiere contacto (palabra clave, o interés si `detectar_interes`) | Respuesta con DeepSeek + respuesta privada con los 3 botones (si ≤ 7 días y la persona no está ya en el flujo). |
| LimpiaExpress (o el aliado configurado) | Texto fijo que rota. |
| crítica | Texto fijo + evento de alerta. |
| ofensa/spam | Sin respuesta + evento de alerta. |
| confianza < umbral | `revision`, con borrador de DeepSeek. |

- `modo = borradores` o `sensible = true` → **todo** va a `revision`.
- Orden de escritura: fila `reservado` → publicar → `respondido`. Si la
  publicación falla → `error`, con el mensaje, y **no** se reintenta sola: se
  reintenta desde el panel.

### 5.3 Mensajes directos del flujo

Solo para `social_personas` con `paso` en esperando_boton · esperando_texto ·
asesoria_enviada · enviado_aliado, y solo mensajes posteriores a `desde`.

- Texto = botón «Sí, tengo negocio» (o «sí», «claro»…) → texto + tarjeta con
  `enlaces.tarjeta(landing, persona)` → `asesoria_enviada`.
- Botón del aliado → texto + tarjeta al perfil del aliado → `enviado_aliado`.
- «No» → «¡Listo! Cuéntanos en qué te podemos ayudar» → `esperando_texto`.
- Texto libre → Jev (negocio · aliado · otro). Si es seguro, pasa a la rama
  correspondiente; si no, va a `revision` con borrador.
- Cualquier mensaje tras `asesoria_enviada` o `enviado_aliado` → `revision`.
- Fuera de la ventana de 24 h no se intenta enviar: evento visible.

### 5.4 Responder desde el panel (Chats)

`POST /api/social/chats/:igsid/enviar` → verifica la sesión y la ventana de 24 h →
envía texto, tarjeta o botones por Composio **en ese momento** → registra con
`origen = victor`. Un interruptor por conversación pausa el agente con esa
persona.

### 5.5 Métricas (cada hora)

`POST /api/social/metricas` (mismo reloj externo, cada 60 min): por cada
publicación con automatización o de los últimos 30 días, pide views, reach,
reels_skip_rate, ig_reels_avg_watch_time, saved, shares, likes y comments
(verificados contra la API el 27 sep 2026) y guarda una fila en `social_metricas`.

### 5.6 Análisis de video

Botón «Analizar video» en Publicación → `POST /api/social/video/:id`:
1. Descargar `media_url` → subir a la File API de Gemini.
2. Pedir un JSON validado: transcripción con tiempos, escenas (inicio, fin, qué
   se ve, qué se dice), texto en pantalla y evaluación del gancho con los ejes de
   la rúbrica de `video-viral` (retención y moneda social por separado).
3. «Subir captura de retención» → Gemini lee la imagen y devuelve puntos
   (segundo, %) → se calculan las caídas > 8 puntos en ≤ 3 s y se alinean con las
   escenas.

Si el video pesa más de lo que admite una ejecución en Hobby, se procesa por
partes o se deja el aviso «video muy largo para analizar aquí». No se inventa una
curva.

### 5.7 Seguimiento de la landing

- `<SeguimientoSocial landing="…">` (componente cliente) en las páginas de
  `/servinomic/*`: lee `?c=`, guarda el código en `sessionStorage`, registra la
  visita, el desplazamiento máximo, las secciones vistas (`IntersectionObserver`
  sobre `[data-seccion]`) y los clics (selector + posición relativa), y marca el
  **clic muerto** (sobre algo que no es enlace, botón ni campo) y el **clic de
  rabia** (3 o más en ≤ 1 s dentro de 24 px). Envía con `navigator.sendBeacon` a
  `/api/social/t`.
- El formulario de 3 pasos informa el paso alcanzado y guarda `social_codigo` en
  el lead.
- Aviso de privacidad breve, con enlace, visible en la landing. Sin `?c=` la
  visita es anónima.

---

## 6. Pantallas (`/social/*`)

Todas usan el layout con menú lateral del diseño, se adaptan a 390 px y usan la
paleta SEÑAL (`src/styles/senal.css`).

| Ruta | Contenido | Fase |
|---|---|---|
| `/social/entrar` | Contraseña. | 1 |
| `/social` | Inicio: KPIs de 30 días, tabla de publicaciones (agente, landing, vistas, comentarios, leads, por atender), «Presta atención a esto», recomendaciones por regla. | 2 |
| `/social/publicaciones/[id]` | Encabezado, pestañas (Resumen · Video y gancho · Comentarios · Conversaciones · Landing y mapa de calor), embudo, comentarios que merecen atención, selector de publicación. | 2 · 5 · 6 |
| `/social/atender` | Revisión: comentarios y mensajes en `revision`, alertas, borrador editable, corregir el tipo de Jev. | 2 |
| `/social/chats` | Lista con filtros (te necesitan · del agente · leads · por publicación), conversación, editor con borrador IA / tarjeta / botones, ficha de la persona. | 3 |
| `/social/automatizaciones/[id]` | Modo, tema sensible, landing, palabras clave, detectar interés, umbral, reglas por tipo, flujo de mensajes, textos, probar con un comentario (simulación). | 4 |
| `/social/ajustes` | Pausa global, simulación, consumo del mes, estado del reloj (último ciclo). | 1 |
| `/social/publicaciones` | Tabla completa con filtros (Todas · Automatizadas · Con landing · Reels · Publicaciones · Reels de prueba · Por atender). Los mismos filtros van en Inicio. «Reel de prueba» = `is_shared_to_feed: false`; la API no los marca de otra forma. | 2 |
| `/social/automatizaciones` | Lista de automatizaciones con filtros por modo, «+ Automatizar publicación». | 4 |
| `/social/landings` | Landings medidas (30 días) y mapa de calor de la elegida. | 6 |
| `/social/contactos` | Personas que entraron por Instagram, con rama, landing, formulario y datos del lead. | 6 |

Las recomendaciones de Inicio salen de reglas explícitas (p. ej. «tiene
comentarios con intención de fundación y no tiene landing»), nunca de cifras
inventadas.

---

## 7. Seguridad y límites

- **Variables de entorno en Vercel:** `COMPOSIO_CONSUMER_KEY`, `TYPESAFE_API_KEY`,
  `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `PANEL_SOCIAL_PASSWORD`,
  `SOCIAL_CRON_SECRET`. Nunca en el código ni en el cliente.
- **Rutas `/api/social/*`:** exigen sesión del panel, salvo `/ciclo` y
  `/metricas` (clave del reloj) y `/t` (pública, con límite de tamaño y sin datos
  personales más allá del código).
- **Next 16:** el proxy (antes `middleware`) solo ejecuta next-intl; `/social`
  queda fuera de su `matcher`. La protección se hace en el layout del servidor y
  en cada ruta de API, como el panel de leads. Antes de escribir código se leen
  las guías de `node_modules/next/dist/docs/` que apliquen (AGENTS.md).
- **Límites de Meta:** respuesta pública ≤ 300 caracteres; botones ≤ 20
  caracteres; respuesta privada 1 vez y ≤ 7 días; ventana de 24 h para mensajes
  directos.
- **Composio (100.000 llamadas/mes gratis):** una consulta por ciclo más lo que
  haya nuevo, con frecuencia decreciente. Estimado: ≈ 7.000 al mes por video
  automatizado. El consumo se muestra en Ajustes.
- **Vercel Hobby:** ejecuciones cortas (tope de 6 acciones, sin esperas). Riesgo
  anotado: el plan Hobby es para uso no comercial; si Vercel lo señala, la salida
  es pasar a Pro (Vercel Cron cada minuto), sin cambiar código.

---

## 8. Errores y observabilidad

- Cada error va a `social_eventos` (nivel `error`) y se ve en Ajustes y en Inicio.
- Si el ciclo falla 5 veces seguidas → evento de nivel `alerta` en Inicio.
- Si el último ciclo tiene más de 5 minutos, Inicio muestra «El reloj no está
  corriendo».
- cron-job.org avisa por correo de las fallas (configuración de la cuenta de
  Victor).

---

## 9. Pruebas

- `node --test src/lib/social/*.test.ts` (Node 24 ejecuta TypeScript sin compilar)
  para `reglas`, `enlaces`, `preguntas` y el reconocimiento de botones. Sin
  dependencias nuevas.
- **Regresión de Jev:** script con los 48 comentarios de verdad conocida
  (`ig-agente/prueba/comentarios.json`); se exige ≥ 46/48 y 0 errores por encima
  del umbral.
- **Pantallas:** oráculos de Playwright en `scripts/oraculos/` para `/social`
  (1440 y 390 px), con control positivo, como exige la suite actual.
- **Instagram real:** al final de las fases 1, 3 y 7, la prueba de C2 con una
  cuenta que nunca escribió.
- `npm run build` y `npm run lint` en verde antes de cada entrega.

---

## 10. Fases

Cada fase se entrega funcionando en la vista previa de Vercel (rama
`feat/social`). **Nada llega a producción sin el OK de Victor.**

| Fase | Entrega | Verificación |
|---|---|---|
| 1 · Base | Tablas `social_*`, login, módulos del agente, `/api/social/ciclo`, Ajustes mínimo, reloj en cron-job.org apuntando a la vista previa, en simulación. | Pruebas unitarias; regresión de Jev; ciclo en simulación sobre una publicación real; luego automático con la cuenta de prueba (C2 en la vista previa). |
| 2 · Panel | Inicio, Publicación (Resumen y Comentarios), Por atender, con datos reales. | Oráculos 1440/390; cifras cruzadas con Instagram. |
| 3 · Chats | Chats completos, envío inmediato, pausa por conversación. | Envío real a la cuenta de prueba desde el panel. |
| 4 · Automatización | Editor por publicación, simulador, duplicar configuración; el agente lee todo de la base de datos. | Crear la automatización de una publicación nueva sin tocar código y probarla. |
| 5 · Métricas y video | Métricas cada hora, pestaña Video y gancho, análisis con Gemini, lectura de la captura. | Métricas iguales a las de la app de Instagram; análisis de un reel real. |
| 6 · Landing | Seguimiento, mapa de calor por elemento, clics muertos y de rabia, embudo por pregunta, aviso de privacidad, `social_codigo` en leads. | Recorrido real desde la tarjeta → datos en la ficha de la persona (C3). |
| 7 · Cierre | Pase a producción con OK, reloj apuntando a producción, prueba C2 con el Mac apagado, retiro del agente local (C4). | Las cuatro condiciones de la sección 1. |

**Pase a producción del agente:** al terminar la fase 1 (con OK de Victor), para
no esperar al panel completo. Mientras tanto, el agente local sigue cubriendo el
video del 28 sep. **Nunca corren los dos a la vez sobre la misma publicación:**
antes de activar el de Vercel se desactiva la publicación en el local.

---

## 11. Lo que necesita Victor

1. Crear la cuenta gratuita de **cron-job.org** (o autorizar que se use otra). La
   clave del reloj la genera el sistema.
2. Dar el **OK a cada paso a producción**.
3. Una **cuenta de Instagram de prueba** que nunca le haya escrito a
   @calidevdev (para C2 y C3).
4. Confirmar que la clave de Gemini de `jev-hotel/.env` se puede usar aquí
   (plan gratuito: suficiente para analizar videos uno a uno).
5. Rotar la clave de Jev (se pegó en un chat el 21 sep) antes de subirla a
   Vercel.
