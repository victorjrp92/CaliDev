# calidev.dev/crm — spec

Estado: borrador v1 · 2026-11-22 · lo leen Victor, Karen y los agentes que lo construyan.

## 0. Para qué existe

Un solo lugar desde el que Calidev opera todo: venta, contratos, clientes, producto, contenido, web y plata.
Debe servir para dos cosas: tener la operación en orden y vender más. La meta es **COP 20M/mes**.

Calidev quiere ser una compañía agéntica, pero los agentes **no cierran ventas**. Hacen dos trabajos:

1. **Preparar.** Victor (o Karen) llega a cada llamada con la información correcta: qué hace la empresa, qué dijo por DM o en el formulario, qué datos públicos hay y qué preguntar.
2. **Atraer.** Mantienen la máquina de inbound: contenido, respuestas, seguimiento y recordatorios.

El humano cierra, fija el precio y firma.

## 1. Principios (no negociables)

1. **Una API, dos caras.** La UI de `/crm` y el CLI `calidev` llaman a la misma API (`/api/crm/v1`). Ninguna lógica vive solo en la UI. Si algo no se puede hacer por API, no está terminado.
2. **Un modelo de permisos para humanos y agentes.** Un agente es un usuario con rol y alcance. No hay puertas traseras.
3. **Acción externa = aprobación.** Lo que sale de Calidev hacia terceros pasa por **Aprobaciones** cuando lo inicia un agente: mensajes, publicaciones, cobros, contratos, correos. Lo interno se ejecuta directo: notas, etapas, tareas, borradores.
4. **Todo queda auditado.** Cada escritura registra quién, qué, cuándo, desde dónde (UI, CLI o agente) y el antes/después.
5. **Un solo dominio interno.** Lo interno vive en `/crm/**`. Las páginas para clientes siguen públicas, pero se crean y se operan desde el CRM.
6. **Migrar sin romper.** Se mueve un módulo a la vez: se verifica, se pone la redirección y recién entonces se borra la ruta vieja.

## 2. Usuarios y roles

| Usuario | Rol | Puede |
|---|---|---|
| Victor | `dueno` | Todo, incluido usuarios, claves y aprobar cualquier cosa |
| Karen | `socia` | Todo lo operativo, incluido aprobar cobros, contratos y mensajes; no borra usuarios ni rota claves de otros |
| Agente de preparación | `agente` + alcance `ventas:leer`, `contactos:escribir`, `notas:escribir` | Investigar, escribir el brief y crear tareas |
| Agente de inbound | `agente` + `contenido:*`, `bandeja:borrador` | Redactar y programar; publicar o enviar va a Aprobaciones |
| Agente de cobros | `agente` + `finanzas:leer`, `cobros:borrador` | Detectar mora y proponer recordatorios |

- Los permisos tienen la forma `area:verbo` (`ventas:leer`, `ventas:escribir`, `cobros:crear`, `aprobaciones:decidir`…).
- Un rol es un conjunto de permisos.
- Ningún rol `agente` tiene `aprobaciones:decidir`, `oportunidad:ganar`, `contrato:enviar` ni `precio:fijar`. Eso es lo que significa «los agentes no cierran» puesto en código.
- Cada clave de agente pertenece a un humano: el que la creó responde por ella.

## 3. Pestañas

Las pestañas marcadas con ★ no existen hoy en ninguna forma.

| # | Pestaña | Qué hay dentro | Hoy está en |
|---|---|---|---|
| 1 | **Hoy** | Llamadas del día con su brief; tareas vencidas; oportunidades sin próximo paso; aprobaciones pendientes; cobros que vencen; embudo de la semana contra la meta (§8) | — |
| 2 | **Bandeja** ★ | Entrada única: DM de Instagram, formulario de contacto, respuestas de leads y comentarios que piden atención. Cada hilo apunta a su persona | `/social/atender`, `/social/chats`, correo |
| 3 | **Aprobaciones** ★ | Cola de acciones externas propuestas por agentes, con el texto o monto exacto: aprobar, editar o rechazar. Debajo, el registro de auditoría | — |
| 4 | **Contactos** | Personas y empresas, con la línea de tiempo de todo lo que pasó con cada una: DM, citas, contratos, pagos y notas. Fusión de duplicados | `/servinomic/leads`, `/social/contactos`, `/admin/leads` |
| 5 | **Ventas** | Pipeline lead → calificado → diagnóstico agendado → diagnóstico hecho → propuesta → negociación → ganado/perdido. Cada oportunidad lleva un próximo paso con fecha obligatorio, su propuesta y su motivo de pérdida. Referidos | `seguimiento` (etapas), `/servinomic/leads` |
| 6 | **Agenda** | Citas y diagnósticos (crear, mover, cancelar), horarios disponibles, recordatorios y el brief de cada cita | `/servinomic/leads` (sub-rutas agendar, recordar, sesiones…) |
| 7 | **Contratos** | Plantillas, contratos generados, estado de firma por firmante y reenvío de códigos | `/servinomic/contratos` |
| 8 | **Clientes y proyectos** | Cliente ganado → proyecto: arranque (formulario), instancia desplegada, responsable (Victor o Karen), soporte, deploys e incidencias | `/servinomic/arranques` |
| 9 | **Productos** ★ | Catálogo con precio de arranque, mensualidad y moneda. Promociones como la de captura (-15 % en el arranque). Instancias por cliente | Precios sueltos en código y textos |
| 10 | **Contenido** | Pipeline de piezas en IG, LinkedIn y TikTok (idea → guion → grabado → publicado), métricas, campañas, automatizaciones y landings | `/social/publicaciones`, `/social/automatizaciones`, `/social/landings`, `/admin/social` |
| 11 | **Web** | Textos del sitio (hero, servicios, testimonios, portafolio), blog y opiniones | `/admin/hero`, `/admin/services`, `/admin/testimonials` |
| 12 | **Finanzas** | Cobros (links de Stripe y transferencias), MRR, cartera y mora, gastos (APIs, hosting, herramientas), margen por cliente, COP y EUR, y exportación para el contador | `/admin/payments`, `social_consumo` |
| — | **Ajustes** | Usuarios, roles, claves de agentes e integraciones (Composio, Stripe, Resend, Gemini, Croma) | variables de entorno, `social_ajustes` |

## 4. Modelo de datos

**Regla:** las tablas nuevas llevan el prefijo `crm_` (`contactos` ya existe y es el formulario de contacto). Las tablas actuales **no se borran ni se renombran** en las fases 1 y 2. Las entidades del CRM las referencian por id y se llenan con un backfill que se puede repetir sin duplicar.

### Núcleo (fase 1)

| Tabla | Campos clave | Notas |
|---|---|---|
| `crm_usuarios` | id, nombre, correo único, tipo (`humano`/`agente`), rol, hash_clave, activo, creado_por | Victor y Karen son humanos y se sembran por script; los agentes se crean desde Ajustes |
| `crm_claves` | id, usuario_id, prefijo visible, hash, alcances[], expira_at, ultimo_uso_at, revocada_at | Formato `cdv_<prefijo>_<secreto>`; solo se guarda el hash |
| `crm_auditoria` | id, usuario_id, origen (`ui`/`cli`/`agente`/`sistema`), accion, entidad, entidad_id, antes jsonb, despues jsonb, at | Solo se inserta; nunca hay update ni delete |
| `crm_empresas` | id, nombre, nit, pais, sector, tamano, sitio, notas | El NIT se usa para consultar Croma (DIAN/RUES) |
| `crm_personas` | id, empresa_id, nombre, correo, whatsapp, igsid, usuario_ig, origen, notas | La identidad se resuelve por correo, luego whatsapp y luego igsid; fusionar deja un alias |
| `crm_personas_ref` | persona_id, tabla, ref_id | Une una persona con `leads.id`, `citas.id`, `social_personas.igsid`, `contrato_firmantes.id`, `payment_links.id`, `contactos.id` |
| `crm_oportunidades` | id, empresa_id, persona_id, producto_id, etapa, valor_arranque, valor_mensual, moneda, responsable_id, proximo_paso, proximo_paso_at, motivo_perdida, origen (campaña o UTM), referido_por | `proximo_paso_at` es NOT NULL mientras la oportunidad esté abierta |
| `crm_etapas_historial` | oportunidad_id, de, a, usuario_id, at | Las tasas de conversión y la velocidad del embudo salen de esta tabla |
| `crm_tareas` | id, titulo, area, entidad, entidad_id, asignada_a (humano o agente), vence_at, estado | Los agentes toman tareas como lo haría Karen |
| `crm_notas` | id, entidad, entidad_id, autor_id, tipo (`nota`/`brief`/`resumen_llamada`), cuerpo | El brief de preparación es una nota de tipo `brief` |
| `crm_aprobaciones` | id, solicitante_id, tipo (`mensaje_ig`, `correo`, `publicacion`, `cobro`, `contrato`…), payload jsonb, vista_previa, estado, decidido_por, decidido_at, resultado | Si se aprueba, el ejecutor corre el payload **exacto** que se vio. Si se edita, se guarda la versión nueva |

### Finanzas y productos (también fase 1)

| Tabla | Campos clave | Notas |
|---|---|---|
| `crm_productos` | id, nombre, descripcion, activo | |
| `crm_precios` | producto_id, concepto (`arranque`/`mensualidad`/`persona_adicional`), valor, moneda, incluye (p. ej. «hasta 10 personas»), vigente_desde, vigente_hasta | Es el precio publicado. Cambiarlo cierra la vigencia del anterior; el historial no se pisa |
| `crm_promos` | id, codigo, descripcion, concepto, porcentaje o valor, vigente_desde/hasta | La de captura: -15 % en el arranque |
| `crm_suscripciones` | id, empresa_id, producto_id, oportunidad_id, contrato_id, valor_arranque, valor_mensual, moneda, personas, permanencia_hasta, inicio, estado (`activa`/`pausada`/`cancelada`) | Lleva el precio pactado con el cliente, que puede ser distinto del publicado |
| `crm_cobros` | id, empresa_id, suscripcion_id, concepto (`arranque`/`cuota`/`mensualidad`/`otro`), valor, moneda, tasa_eur, vence_at, pagado_at, metodo (`stripe`/`transferencia`/`efectivo`), payment_link_id, estado | La mora es un cobro con `vence_at < hoy` y sin pagar. Los cobros de Stripe enlazan con `payment_links` |
| `crm_gastos` | id, fecha, proveedor, concepto, valor, moneda, tasa_eur, empresa_id (si es de un cliente), recurrente | El margen por cliente se calcula con los gastos que tienen `empresa_id` |

**Catálogo inicial**, tomado de los precios publicados en `src/lib/contratos/plantilla-servinomic.ts`:

| Producto | Concepto | Valor (COP) |
|---|---|---|
| ServiNomic | Arranque (una vez) | 2.500.000 |
| ServiNomic | Mensualidad, hasta 10 personas | 250.000 |
| ServiNomic | Persona adicional por mes | 15.000 |

Los demás productos (SeiriLegal, webs, automatizaciones…) los crean Victor o Karen desde Productos.

**Carga inicial:** los clientes, sus suscripciones y lo que deben **no se importan**; Victor y Karen los cargan a mano la primera vez. Para eso, la fase 1 trae el formulario «Alta de cliente» (empresa, contacto, producto, precio pactado y cobros pendientes con fecha) y su equivalente `calidev cliente alta`.

### Fases siguientes

- Fase 2: `crm_proyectos` (enlaza `arranques`, la instancia y su URL, y el responsable) y `crm_incidencias`.
- Fase 3: `crm_piezas` (contenido multi-red; envuelve `social_publicaciones`) y `crm_hilos` (bandeja unificada; envuelve `social_conversaciones` y `contactos`).

## 5. Rutas: qué se mueve, qué queda público

### Internas → `/crm` (la ruta vieja redirige con 308 y se borra después de verificar)

| Hoy | Pasa a |
|---|---|
| `/admin`, `/admin/(dashboard)/*` | `/crm/web/*`, `/crm/finanzas/cobros`, `/crm/contactos` |
| `/social`, `/social/{atender,chats}` | `/crm/bandeja` |
| `/social/contactos` | `/crm/contactos` |
| `/social/{publicaciones,automatizaciones,landings}` | `/crm/contenido/*` |
| `/social/ajustes` | `/crm/ajustes/integraciones` |
| `/servinomic/leads` (+ sub-rutas) | `/crm/ventas`, `/crm/agenda` |
| `/servinomic/contratos` | `/crm/contratos` |
| `/servinomic/arranques` | `/crm/clientes` |
| `/api/admin/*`, `/api/social/*` (lo que sea de panel), `/api/servinomic/panel` | `/api/crm/v1/*` |

**Se quedan donde están:** `/api/social/ciclo` (el cron del agente de IG), `/api/webhooks/stripe` y los demás crons. No son paneles. Desde la fase 1 se autentican con una clave de agente de sistema.

### Públicas (siguen públicas y se operan desde el CRM)

`/[locale]/*`, el blog, `/agendar`, `/cita/[token]`, `/contratos/[token]`, `/arranque/[token]`, `/pay/[id]`, `/receipt/[id]`, `/opinion`, `/servinomic` (landing), `/servinomic/[campana]`, `/servinomic/[campana]/leads`, `/whatsapp` (enlace de la bio), `/nuevo` (ya redirige) y sus APIs públicas (`/api/citas/*`, `/api/contratos/*`, `/api/payments/*`, `/api/leads*`, `/api/contacto`, `/api/opinion`, `/api/arranque*`).

Revisar antes de mover: `/servinomic/[campana]/leads` puede ser un panel por campaña y no una página pública.

## 6. Autenticación unificada

Hoy hay tres esquemas y los tres se van:

- el JWT de admin (`admin_token`, en `src/lib/auth.ts`);
- `panel_social` con contraseña compartida (`src/lib/social/sesion.ts`);
- `src/lib/panel-leads.ts`.

Esquema nuevo:

- **Humanos.** Correo y contraseña (bcrypt) contra `crm_usuarios`. Cookie `crm_sesion`: un JWT con jose y `CRM_JWT_SECRET` nuevo, que lleva id de usuario, rol y versión de sesión; httpOnly, secure, sameSite=lax, 7 días. Karen entra por un enlace de invitación de un solo uso que le pide crear su contraseña. 2FA por correo cuando haya más de dos humanos.
- **Agentes y CLI.** `Authorization: Bearer cdv_…`, que se busca por prefijo y se compara el hash en tiempo constante. Los alcances de la clave limitan los del rol; nunca los amplían.
- **Un solo guardia.** `requerir(permiso)` en cada handler de `/api/crm/v1`. Devuelve el actor (`{ usuario, origen }`) que luego usa la auditoría.
- **Las páginas `/crm/**`** se protegen en el layout del servidor. `src/middleware.ts` hoy solo hace i18n; antes de tocarlo hay que leer en `node_modules/next/dist/docs/` cómo trata Next 16 el middleware/proxy.
- **Corte.** Las sesiones viejas se aceptan solo mientras su módulo no se haya migrado. Cuando se borra el último panel viejo, se borran `ADMIN_JWT_SECRET`, `PANEL_SOCIAL_PASSWORD` y los tres archivos.

## 7. API y CLI

### API `/api/crm/v1`

- Es REST con JSON y está ordenada por recurso (`/personas`, `/oportunidades`, `/tareas`, `/aprobaciones`…).
- Las escrituras aceptan `Idempotency-Key`, para que un agente que reintenta no duplique cobros ni mensajes.
- Los errores tienen la forma `{ error: { codigo, mensaje, campo? } }` y el mensaje dice cómo arreglarlo.
- La lista de endpoints se genera desde el código (`calidev api`), para que los agentes no tengan que adivinarlos.

### CLI `calidev`

- Vive en `cli/` dentro de este repo. Es Node/TypeScript y se instala con `npm link`.
- La configuración está en `~/.config/calidev/config.json` (URL y clave). `calidev login` pega la clave.
- Todo comando acepta `--json`. La salida por defecto es legible para Victor y Karen.
- Códigos de salida: 0 ok · 2 error de uso · 3 sin permiso · 4 quedó pendiente de aprobación · 1 cualquier otro.

```
calidev hoy
calidev persona buscar "<texto>"          calidev persona ver <id>
calidev oportunidad crear|mover|ver        calidev oportunidad proximo-paso <id> "<qué>" --fecha 2026-11-25
calidev tarea listar --mia|--area ventas   calidev tarea tomar|cerrar <id>
calidev nota agregar <entidad> <id> --tipo brief < brief.md
calidev cita listar --semana               calidev cita brief <id>
calidev aprobacion listar|ver|aprobar|rechazar <id>     # aprobar/rechazar: solo humanos
calidev cobro crear --cliente <id> --monto 1200000 --moneda COP   # agente → queda en Aprobaciones
calidev post programar <pieza> --red ig --fecha …       # agente → queda en Aprobaciones
calidev auditoria --entidad oportunidad --id 42
```

### Aprobaciones

- Una acción externa pedida por un agente responde `202 { aprobacion_id }` y el CLI sale con código 4.
- Al aprobarla se ejecuta y se guarda el resultado; un fallo queda visible en la misma ficha.
- Más adelante habrá **permiso permanente por tipo de tarea**, con tope (p. ej. «el agente de cobros puede enviar el recordatorio estándar hasta 1 vez por semana por cliente sin preguntar»). Ese permiso se configura en Ajustes, queda auditado y se revoca con un clic.

## 8. Métricas del embudo (pestaña Hoy)

| Métrica | Definición | Fuente |
|---|---|---|
| Atención | Visitas a landings y alcance de IG por semana | `social_visitas`, `social_metricas` |
| Conversaciones | Personas nuevas que escriben (DM, formulario o WhatsApp) | `social_personas`, `contactos`, `leads` |
| Calificados | Oportunidades que llegan a `calificado` | `crm_etapas_historial` |
| Diagnósticos | Agendados y hechos por semana | `citas` + etapa |
| Propuestas | Oportunidades en `propuesta` | historial |
| Cierres | `ganado` por mes; tasa diagnóstico → ganado | historial |
| Ticket | Arranque promedio y mensualidad promedio | `crm_oportunidades` |
| MRR | Suma de suscripciones activas, en COP | `crm_suscripciones` |
| Ingreso del mes | Lo **cobrado** en el mes: arranques, cuotas, mensualidades y otros, en COP. Lo cobrado en EUR se convierte con la tasa del día del cobro | `crm_cobros` |
| Meta | Ingreso del mes contra COP 20M, y el ritmo necesario | calculado |
| Velocidad | Días promedio entre etapas | historial |

**Meta fijada:** COP 20M/mes cobrados en **mayo de 2027**, seis meses desde el 22-nov-2026.

**Línea base:** 3 cierres en el último mes. El número de diagnósticos de ese mes no está registrado y el CRM empieza a medirlo desde el día 1.

**La cuenta que la pestaña Hoy hace visible.** Con N cierres por mes a precio publicado, el mes 6 cobra N × 2,5M de arranques más 6·N × 0,25M de mensualidades, es decir unos 4·N millones, más el MRR que ya existe.
- Con 3 cierres al mes son unos COP 12M: no alcanza.
- Hacen falta unos 5 cierres al mes a precio publicado.
- Con el precio rebajado del contrato modelo (1,85M y 150k) hacen falta unos 7.

Así, Hoy responde: **¿cuántos diagnósticos por semana hacen falta, con la tasa de cierre real, para llegar a 20M en mayo?**

## 9. Agentes (contratos que se fijan ya, se construyen después)

- **Preparación.** 24 h antes de cada diagnóstico escribe una nota `brief` en la cita:
  - qué hace la empresa;
  - datos de Croma (DIAN/RUES), si hay NIT;
  - lo que la persona dijo por DM o en el formulario;
  - procesos manuales que mencionó;
  - tres preguntas sugeridas y qué producto encaja.

  Si falta información, crea la tarea «pedir X antes de la llamada».
- **Resumen.** Victor pega o dicta las notas de la llamada; el agente las convierte en una nota `resumen_llamada` y propone etapa y próximo paso. Victor confirma.
- **Inbound.** Lo que hoy hace el ciclo de IG se queda igual, pero sus envíos fuera de flujos aprobados entran a Aprobaciones, y sus personas y DM alimentan Contactos y Bandeja.
- **Cobros.** Detecta la mora y propone recordatorios. Nunca crea un cobro sin aprobación.

## 10. Fases

Cada fase se da por terminada solo cuando pasan sus compuertas, verificadas en el navegador (escritorio y móvil) y por el CLI.

### Fase 1: núcleo, venta, contratos y plata

La fase 1 es grande, así que sale en tres entregas. Cada entrega queda en producción y en uso antes de empezar la siguiente.

#### 1a. Base y venta
Alcance: auth unificada, usuarios, claves, auditoría, Contactos, Ventas, Agenda, Hoy (sin plata), Aprobaciones (solo la cola) y el CLI.

Compuertas:
- Karen entra con su invitación y ve el pipeline.
- Una clave de agente sin `ventas:escribir` recibe 403 al intentar mover una etapa.
- Toda escritura deja una fila en `crm_auditoria`.
- `calidev hoy --json` devuelve las citas del día.
- El backfill corre dos veces sin crear duplicados.
- `/servinomic/leads` redirige a `/crm/ventas`.

#### 1b. Contratos
Alcance: plantillas, generación desde una oportunidad (con el precio pactado y la promo aplicada), estado de firma y reenvío de códigos.

Compuertas:
- Un contrato creado desde una oportunidad trae empresa, contacto y precio sin escribirlos dos veces.
- Un agente que pide enviar un contrato queda en Aprobaciones, y Karen lo puede aprobar.
- `/servinomic/contratos` redirige.

#### 1c. Finanzas y Productos
Alcance: catálogo (sembrado con ServiNomic), precios con vigencia, promos, alta de cliente, suscripciones, cobros (Stripe y transferencia), mora, gastos, MRR, ingreso del mes y meta en Hoy, y exportación en CSV para el contador.

Compuertas:
- El MRR coincide con una suma a mano.
- Un cobro en EUR guarda la tasa del día.
- Un cobro vencido aparece en Hoy.
- Un agente que crea un cobro queda en Aprobaciones.
- Ganar una oportunidad con contrato firmado crea la suscripción.
- `/admin/payments` redirige.

### Fase 2: Clientes y proyectos
Alcance: arranques, instancias, soporte y responsables.

Compuertas:
- Ganar una oportunidad crea el proyecto y el arranque.
- `/servinomic/arranques` redirige.

### Fase 3: Contenido, Web y Bandeja
Alcance: bandeja unificada, pipeline de contenido multi-red y textos del sitio.

Compuertas:
- Un DM nuevo aparece en Bandeja ligado a su persona.
- `/social/*` y `/admin/*` redirigen.
- Se borran los tres esquemas de auth viejos.

## 11. Fuera de alcance (por ahora)

- Facturación electrónica. El contador sigue recibiendo la exportación; la parte fiscal es en Alemania.
- Nómina.
- Integración directa con LinkedIn y TikTok: la fase 3 empieza con registro manual de piezas y métricas.
- Que los agentes negocien precio o descuentos.

## 12. Decidido (22-nov-2026)

1. **Precios:** el catálogo se siembra con los precios publicados de ServiNomic. Los clientes y sus deudas los cargan Victor y Karen a mano la primera vez.
2. **Línea base:** 3 cierres en el último mes.
3. **Meta:** COP 20M/mes en 6 meses, es decir mayo de 2027.
4. **Aprobaciones:** Karen aprueba cobros, contratos y mensajes, igual que Victor.
5. **Fase 1:** incluye Contratos y Finanzas.

