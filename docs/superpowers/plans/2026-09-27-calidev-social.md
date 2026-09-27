# calidev.dev/social — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** llevar el agente de Instagram del Mac a calidev.dev y construir el panel `/social` completo, hasta cumplir las condiciones C1–C4 del spec.

**Architecture:** módulos TypeScript en `src/lib/social/` (un archivo por responsabilidad) sobre el Postgres existente; rutas en `src/app/api/social/*` y páginas en `src/app/social/*`; un reloj externo (cron-job.org) llama cada minuto a `/api/social/ciclo`. La lógica pura se prueba con `npx tsx --test` (test runner nativo de Node, sin dependencias nuevas en package.json).

**Tech Stack:** Next.js 16.2.4 (App Router), React 19, Tailwind 4, `@vercel/postgres` (Neon), `jose`, Node 24 + `npx tsx --test` (resuelve imports sin extensión y alias `@/`), Composio MCP por HTTP, Jev (TypeSafe), DeepSeek, Gemini, Playwright (oráculos existentes).

**Spec:** `docs/superpowers/specs/2026-09-27-calidev-social-design.md`

---

## Reglas de ejecución (del usuario y del repo)

- **Sin commits ni push** salvo pedido explícito de Victor. Donde la plantilla de superpowers dice «Commit», aquí dice **«Checkpoint»**: `npm run lint && npm run build` en verde y `git status` revisado. Nada se commitea.
- **Nada a producción sin OK.** Las vistas previas se publican con `vercel deploy` (sin `--prod`).
- **Una sola base de datos** (Neon) para producción, vista previa y local. Las tablas `social_*` son nuevas; el único cambio sobre algo existente es `ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_codigo TEXT` (aditivo). No se borra ni se renombra nada existente.
- **Next 16:** antes de escribir una ruta o página, leer en `node_modules/next/dist/docs/01-app/` la guía que aplique (route handlers, cookies, `dynamic`). El proxy (`src/middleware.ts`) no se toca: su `matcher` no incluye `/social`.
- **Un componente por archivo.** Estilo del repo: comentarios en español que explican el *porqué*, nombres en español.
- **Nunca corren dos agentes sobre la misma publicación.** Antes de activar una publicación en Vercel, se desactiva en el agente local (`http://127.0.0.1:8787`, botón «Activo»).

## Mapa de archivos

```
src/lib/social/
  reglas.ts            (puro) decidir, reconocerBoton, siguienteRevision, puedeRespuestaPrivada, ventanaAbierta
  reglas.test.ts
  enlaces.ts           (puro) enlaceTarjeta, codigoPersona, landingPermitida
  enlaces.test.ts
  preguntas.ts         (puro) TIPOS, PREGUNTAS_COMENTARIO, RAMAS_DM, PREGUNTAS_DM
  textos.ts            (puro) valores iniciales de textos y flujo por publicación
  tipos.ts             (puro) tipos compartidos
  composio.ts          cliente MCP por HTTP
  instagram.ts         operaciones de Instagram
  jev.ts               clasificación
  redactor.ts          DeepSeek
  gemini.ts            análisis de video y lectura de curva
  db.ts                esquema social_* y consultas
  sesion.ts            login del panel
  ciclo-comentarios.ts
  ciclo-mensajes.ts
  ciclo.ts
  metricas.ts
  seguimiento.ts       (puro) detección de clic muerto y de rabia
  seguimiento.test.ts
src/app/api/social/
  sesion/route.ts            POST entrar · DELETE salir
  ciclo/route.ts             POST (clave del reloj)
  metricas/route.ts          POST (clave del reloj)
  t/route.ts                 POST visitas y clics (público)
  ajustes/route.ts           GET · POST
  publicaciones/route.ts     POST sincronizar
  automatizaciones/[id]/route.ts   GET · PUT
  automatizaciones/[id]/probar/route.ts  POST simular
  comentarios/[id]/route.ts  POST aprobar · descartar · corregir · reintentar
  chats/[igsid]/route.ts     GET conversación
  chats/[igsid]/enviar/route.ts   POST texto · tarjeta · botones
  chats/[igsid]/pausa/route.ts    POST
  video/[id]/route.ts        POST analizar · POST curva (multipart)
src/app/social/
  layout.tsx           puerta (sesión) + menú lateral
  menu.tsx             menú lateral (cliente, estado activo)
  puerta.tsx           formulario de contraseña
  page.tsx             Inicio
  atender/page.tsx     Por atender (+ atender-lista.tsx)
  publicaciones/[id]/page.tsx  (+ embudo.tsx, curva.tsx, pestanas.tsx, comentarios-clave.tsx, mapa-calor.tsx)
  chats/page.tsx       (+ lista-chats.tsx, conversacion.tsx, editor.tsx, ficha.tsx)
  automatizaciones/[id]/page.tsx  (+ editor-automatizacion.tsx, flujo.tsx, simulador.tsx)
  ajustes/page.tsx
src/components/social/SeguimientoSocial.tsx   (en landings)
scripts/social/regresion-jev.mjs              48 comentarios de verdad conocida
scripts/oraculos/social.mjs                   oráculo de pantallas
```

---

## FASE 1 · Base (agente en Vercel)

### Task 1: Tipos y preguntas de Jev

**Files:** Create `src/lib/social/tipos.ts`, `src/lib/social/preguntas.ts`

- [ ] **Step 1: tipos compartidos**

```ts
// src/lib/social/tipos.ts
export type TipoComentario =
  | "felicitacion" | "quiere_contacto" | "limpiaexpress"
  | "etiqueta_emoji" | "critica" | "ofensa_spam";
export type RamaDm = "negocio" | "limpiaexpress" | "otro";
export type Accion = "ia" | "contacto" | "fijo_aliado" | "fijo_critica" | "ignorar" | "revision";
export type Modo = "automatico" | "borradores" | "apagado";
export type Paso =
  | "esperando_boton" | "esperando_texto" | "asesoria_enviada" | "enviado_aliado" | "revision";
export type Boton = "si" | "no" | "aliado";

export interface Tarjeta { titulo: string; subtitulo: string; boton: string; url: string }

export interface Textos {
  pregunta: string; si: string; no: string; aliado: string;
  botonSi: string; botonNo: string; botonAliado: string;
  pubContacto: string[]; pubAliado: string[]; pubCritica: string[];
  tarjetaSi: Omit<Tarjeta, "url">; tarjetaAliado: Tarjeta;
}

export interface Automatizacion {
  mediaId: string; modo: Modo; sensible: boolean; activadoEn: string | null;
  landingUrl: string | null; palabrasClave: string[]; detectarInteres: boolean;
  umbral: number; textos: Textos;
}
```

- [ ] **Step 2: preguntas** — copiar literalmente `TIPOS`, `PREGUNTAS_COMENTARIO`, `RAMAS_DM`, `PREGUNTAS_DM` de `~/Documents/Projects/ig-agente/preguntas.py` (versión con la definición refinada de limpiaexpress, 47/48) a `preguntas.ts` como constantes `as const`.

### Task 2: Reglas puras (TDD)

**Files:** Create `src/lib/social/reglas.ts`, Test `src/lib/social/reglas.test.ts`

- [ ] **Step 1: pruebas que fallan**

```ts
// src/lib/social/reglas.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { decidir, reconocerBoton, siguienteRevision, puedeRespuestaPrivada, ventanaAbierta } from "./reglas";

const base = { modo: "automatico" as const, sensible: false, umbral: 0.7, detectarInteres: true };

test("debajo del umbral va a revisión", () => {
  assert.equal(decidir("felicitacion", 0.5, base), "revision");
});
test("tipos seguros → acción", () => {
  assert.equal(decidir("felicitacion", 0.9, base), "ia");
  assert.equal(decidir("etiqueta_emoji", 0.9, base), "ia");
  assert.equal(decidir("quiere_contacto", 0.9, base), "contacto");
  assert.equal(decidir("limpiaexpress", 0.9, base), "fijo_aliado");
  assert.equal(decidir("critica", 0.9, base), "fijo_critica");
  assert.equal(decidir("ofensa_spam", 0.9, base), "ignorar");
});
test("borradores y tema sensible mandan todo a revisión (salvo ofensa)", () => {
  assert.equal(decidir("felicitacion", 0.99, { ...base, modo: "borradores" }), "revision");
  assert.equal(decidir("quiere_contacto", 0.99, { ...base, sensible: true }), "revision");
  assert.equal(decidir("ofensa_spam", 0.99, { ...base, sensible: true }), "ignorar");
});
test("reconoce botones y variantes escritas", () => {
  const t = { botonSi: "Sí, tengo negocio", botonNo: "No", botonAliado: "Busco LimpiaExpress" };
  assert.equal(reconocerBoton("Sí, tengo negocio", t), "si");
  assert.equal(reconocerBoton("si", t), "si");
  assert.equal(reconocerBoton("  SÍ!! ", t), "si");
  assert.equal(reconocerBoton("No", t), "no");
  assert.equal(reconocerBoton("Busco LimpiaExpress", t), "aliado");
  assert.equal(reconocerBoton("limpia express", t), "aliado");
  assert.equal(reconocerBoton("tengo un spa en Madrid", t), null);
});
test("frecuencia según edad de la activación", () => {
  const h = 3600_000;
  assert.equal(siguienteRevision(1 * h), 60_000);
  assert.equal(siguienteRevision(80 * h), 15 * 60_000);
  assert.equal(siguienteRevision(15 * 24 * h), null); // se apaga
});
test("respuesta privada ≤ 7 días", () => {
  const ahora = Date.parse("2026-09-27T12:00:00Z");
  assert.equal(puedeRespuestaPrivada("2026-09-21T12:00:00+0000", ahora), true);
  assert.equal(puedeRespuestaPrivada("2026-09-19T12:00:00+0000", ahora), false);
});
test("ventana de 24 h", () => {
  const ahora = Date.parse("2026-09-27T12:00:00Z");
  assert.equal(ventanaAbierta("2026-09-26T13:00:00+0000", ahora), true);
  assert.equal(ventanaAbierta("2026-09-26T11:00:00+0000", ahora), false);
});
```

- [ ] **Step 2:** `npx tsx --test src/lib/social/reglas.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 3: implementación mínima**

```ts
// src/lib/social/reglas.ts
import type { Accion, Boton, Modo, TipoComentario } from "./tipos";

const H = 3600_000;

export function decidir(
  tipo: TipoComentario, confianza: number,
  c: { modo: Modo; sensible: boolean; umbral: number; detectarInteres: boolean },
): Accion {
  if (tipo === "ofensa_spam" && confianza >= c.umbral) return "ignorar";
  if (confianza < c.umbral || c.modo === "borradores" || c.sensible) return "revision";
  const mapa: Record<TipoComentario, Accion> = {
    felicitacion: "ia", etiqueta_emoji: "ia", quiere_contacto: "contacto",
    limpiaexpress: "fijo_aliado", critica: "fijo_critica", ofensa_spam: "ignorar",
  };
  return mapa[tipo];
}

export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()
    .replace(/^[\s¡¿!?.]+|[\s¡¿!?.]+$/g, "").replace(/\s+/g, " ");
}

export function reconocerBoton(
  texto: string, t: { botonSi: string; botonNo: string; botonAliado: string },
): Boton | null {
  const n = normalizar(texto);
  const si = new Set([normalizar(t.botonSi), "si", "sip", "claro", "si tengo", "si tengo negocio"]);
  const no = new Set([normalizar(t.botonNo), "no", "nop", "no tengo"]);
  const aliadoBase = normalizar(t.botonAliado).replace(/^busco /, "");
  const aliado = new Set([normalizar(t.botonAliado), aliadoBase, aliadoBase.replace(/\s/g, ""), "limpia express"]);
  if (si.has(n)) return "si";
  if (no.has(n)) return "no";
  if (aliado.has(n) || aliado.has(n.replace(/\s/g, ""))) return "aliado";
  return null;
}

/** ms hasta la próxima revisión; null = apagar la automatización. */
export function siguienteRevision(msDesdeActivacion: number): number | null {
  if (msDesdeActivacion < 72 * H) return 60_000;
  if (msDesdeActivacion < 14 * 24 * H) return 15 * 60_000;
  return null;
}

export const fechaIg = (ts: string) => Date.parse(ts.replace(/\+0000$/, "Z"));

export function puedeRespuestaPrivada(tsComentario: string, ahora = Date.now()): boolean {
  return ahora - fechaIg(tsComentario) < 7 * 24 * H;
}

export function ventanaAbierta(tsUltimoDeElla: string, ahora = Date.now()): boolean {
  return ahora - fechaIg(tsUltimoDeElla) < 24 * H;
}
```

- [ ] **Step 4:** `npx tsx --test src/lib/social/reglas.test.ts` → PASS (7 tests).
- [ ] **Step 5: Checkpoint.**

### Task 3: Enlaces y código de persona (TDD)

**Files:** Create `src/lib/social/enlaces.ts`, Test `src/lib/social/enlaces.test.ts`

- [ ] **Step 1: pruebas**

```ts
// src/lib/social/enlaces.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceTarjeta, codigoPersona, landingPermitida } from "./enlaces";

test("código estable, corto y sin el igsid", () => {
  const a = codigoPersona("1010871755112354", "sal");
  assert.equal(a, codigoPersona("1010871755112354", "sal"));
  assert.match(a, /^[a-z0-9]{10}$/);
  assert.ok(!a.includes("1010871755"));
});
test("enlace con UTM y código", () => {
  const u = new URL(enlaceTarjeta("https://calidev.dev/servinomic/limpiaexpress", "abc123xyz0", "testimonio-deisy"));
  assert.equal(u.searchParams.get("utm_source"), "instagram");
  assert.equal(u.searchParams.get("utm_medium"), "dm");
  assert.equal(u.searchParams.get("utm_campaign"), "testimonio-deisy");
  assert.equal(u.searchParams.get("c"), "abc123xyz0");
});
test("solo landings de dominios propios", () => {
  assert.equal(landingPermitida("https://calidev.dev/servinomic/limpiaexpress"), true);
  assert.equal(landingPermitida("https://seiricon.com/go/juntos"), true);
  assert.equal(landingPermitida("https://evil.com/x"), false);
  assert.equal(landingPermitida("javascript:alert(1)"), false);
});
```

- [ ] **Step 2:** `npx tsx --test src/lib/social/enlaces.test.ts` → FAIL.
- [ ] **Step 3: implementación**

```ts
// src/lib/social/enlaces.ts
import { createHash } from "node:crypto";

const DOMINIOS = ["calidev.dev", "seiricon.com", "www.instagram.com", "instagram.com"];

/** Código para ?c=: deriva del igsid con sal, así la URL no expone el id de Instagram. */
export function codigoPersona(igsid: string, sal: string): string {
  const h = createHash("sha256").update(`${sal}:${igsid}`).digest();
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(h.subarray(0, 10), (b) => abc[b % abc.length]).join("");
}

export function landingPermitida(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && DOMINIOS.includes(u.hostname);
  } catch { return false; }
}

export function enlaceTarjeta(landing: string, codigo: string, campana: string): string {
  const u = new URL(landing);
  if (!u.hostname.endsWith("instagram.com")) {
    u.searchParams.set("utm_source", "instagram");
    u.searchParams.set("utm_medium", "dm");
    u.searchParams.set("utm_campaign", campana);
    u.searchParams.set("c", codigo);
  }
  return u.toString();
}
```

- [ ] **Step 4:** PASS. **Step 5:** Checkpoint.

### Task 4: Textos por defecto

**Files:** Create `src/lib/social/textos.ts` — exporta `TEXTOS_INICIALES: Textos` con los valores exactos de `~/Documents/Projects/ig-agente/config.py` (DM_PREGUNTA, DM_SI, DM_NO, DM_LE, botones, PUB_CONTACTO, PUB_LIMPIAEXPRESS, PUB_CRITICA, TARJETA_SI sin url, TARJETA_LE con `https://www.instagram.com/limpiaexpress_cali/`) y `ESTILO_IA` (el prompt de config.py, igual).

### Task 5: Esquema de base de datos

**Files:** Create `src/lib/social/db.ts`

- [ ] **Step 1:** `crearEsquema()` con `CREATE TABLE IF NOT EXISTS` para las 12 tablas `social_*` del spec §4 (columnas exactas del spec; `social_personas.codigo TEXT UNIQUE`; índices en `social_comentarios(media_id, ts)`, `social_mensajes(igsid, ts)`, `social_metricas(media_id, medido_en)`, `social_clics(visita_id)`), más `ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_codigo TEXT` y `INSERT … ON CONFLICT DO NOTHING` de ajustes `pausado=0`, `simulacion=1`. Guardar en memoria del proceso que ya corrió (`let listo: Promise<void> | null`), como hace `api/leads/delegar` con sus columnas.
- [ ] **Step 2:** helpers con nombre: `ajuste(clave)`, `fijarAjuste`, `evento(texto, nivel, mediaId?)`, `tomarCandado(segundos)`, `soltarCandado()`, `automatizacionesActivas()`, `comentariosVistos(mediaId)`, `reservarComentario(fila)`, `confirmarComentario(id, estado, respuesta, error?)`, `persona(igsid)`, `crearPersona(...)`, `actualizarPersona(...)`, `mensajesVistos(igsid)`, `guardarMensaje(...)`, `sumarConsumo(servicio, n)`.
- [ ] **Step 3: verificación contra la base real:** `npx tsx -e "import('./src/lib/social/db.ts').then(m=>m.crearEsquema()).then(()=>console.log('ok'))"` con `POSTGRES_URL` de `vercel env pull .env.social.local --environment=development` (archivo ignorado por git, borrarlo al terminar la fase). Luego `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'social_%'` → 12 filas.

### Task 6: Cliente Composio, Instagram, Jev, DeepSeek

**Files:** Create `composio.ts`, `instagram.ts`, `jev.ts`, `redactor.ts` en `src/lib/social/`

- [ ] **Step 1: `composio.ts`** — traducción directa de `ig-agente/composio_mcp.py` (probado): `fetch` a `https://connect.composio.dev/mcp` con cabecera `x-consumer-api-key: process.env.COMPOSIO_CONSUMER_KEY`, `Accept: application/json, text/event-stream`; parsear la última línea `data:`; sesión en variable de módulo, reabrir con 400/404. `herramienta(slug, args)` usa `COMPOSIO_MULTI_EXECUTE_TOOL`; `proxy(metodo, url, body?, query?)` usa `COMPOSIO_REMOTE_WORKBENCH` con el código Python que imprime `@@json@@error`. Cada llamada suma 1 en `social_consumo` (composio).
- [ ] **Step 2: `instagram.ts`** — mismas funciones que `ig-agente/instagram.py` + `publicacionesConConteo()` (fields `id,caption,timestamp,permalink,comments_count,media_type,media_product_type,thumbnail_url,media_url`) + `metricasReel(id)` (metrics `views,reach,reels_skip_rate,ig_reels_avg_watch_time,saved,shares,likes,comments`, una llamada por métrica, ignorando las que den 400).
- [ ] **Step 3: `jev.ts`** — `fetch` POST `https://api.typesafe.ai/v1/systemone` con `model: "jev-latest"`; `clasificarComentario(texto)` y `clasificarDm(texto)` → `{ tipo, confianza }`. Reintento con espera exponencial ante 429/5xx (4 intentos).
- [ ] **Step 4: `redactor.ts`** — `redactar(comentario, intencion)` a `https://api.deepseek.com/chat/completions` (`deepseek-chat`, temperature 0.9, max_tokens 120), sistema = `ESTILO_IA`; quitar comillas; recortar a 290.
- [ ] **Step 5: humo real** (lectura, sin publicar): script `scripts/social/humo.mjs` que importa `instagram.ts` y `jev.ts` y verifica: usuario `calidevdev`, ≥ 1 publicación, «Ayuda» → `quiere_contacto` ≥ 0,7. Correr con `npx tsx`.

### Task 7: Regresión de Jev

**Files:** Create `scripts/social/regresion-jev.mjs`, copiar `~/Documents/Projects/ig-agente/prueba/comentarios.json` a `scripts/social/comentarios-verdad.json`

- [ ] Script: clasifica los 48 con 6 en paralelo; imprime acierto por clase; **sale con código 1** si aciertos < 46 o si hay algún error con confianza ≥ 0,7. Correr: `npx tsx scripts/social/regresion-jev.mjs` → `47/48 · errores automáticos 0`.

### Task 8: Ciclos del agente

**Files:** Create `ciclo-comentarios.ts`, `ciclo-mensajes.ts`, `ciclo.ts` en `src/lib/social/`

- [ ] **Step 1: `ciclo-comentarios.ts`** — por cada automatización activa con `proxima_revision <= now()` y `comments_count` distinto del guardado: traer comentarios; ignorar propios (`from.username === "calidevdev"`), respuestas (`parent_id`) y anteriores a `activado_en`; por cada nuevo, si quedan ≥ 2 acciones: `jev` → `decidir` → redactar/elegir texto → **`reservarComentario`** → escribir en Instagram (si no hay simulación) → respuesta privada si `contacto` y `puedeRespuestaPrivada` y la persona no existe (crear persona con `codigoPersona`, `paso = esperando_boton`) → `confirmarComentario`. Textos fijos rotan con `aleatorio`. Errores → estado `error` + evento, y seguir.
- [ ] **Step 2: `ciclo-mensajes.ts`** — traducción de `ig-agente/ciclo_dm.py` con `reconocerBoton` y `textos` de la automatización de origen; tarjeta del Sí con `enlaceTarjeta(landing, persona.codigo, slug de la publicación)`; si `ventanaAbierta` es falsa → evento, sin enviar; actualizar `ultimo_mensaje_de_ella`.
- [ ] **Step 3: `ciclo.ts`** — `correrCiclo()`: `tomarCandado(90)`; si ocupado → `{estado:"ocupado"}`; si `pausado` → salir; un `Acciones` con tope 6 y bandera simulación; comentarios → mensajes; recalcular `proxima_revision` (apagar a los 14 días con evento); `fijarAjuste("ultimo_ciclo")`; contador `fallos_seguidos` en ajustes (se pone a 0 si el ciclo termina bien; al llegar a 5 → evento `alerta` «El agente falló 5 veces seguidas»); `soltarCandado()` en `finally`.
- [ ] **Step 4: ruta** `src/app/api/social/ciclo/route.ts`: `export const dynamic = "force-dynamic"`, `maxDuration = 60`; POST exige `Authorization: Bearer ${SOCIAL_CRON_SECRET}` (comparación en tiempo constante); devuelve el resumen JSON.
- [ ] **Step 5: verificación local en simulación:** `npm run dev` + activar una publicación vieja con `modo=automatico`, `simulacion=1`; `curl -X POST -H "Authorization: Bearer $SOCIAL_CRON_SECRET" localhost:3000/api/social/ciclo` → resumen con `simulacion:true`; el comentario «Ayuda» de @victorjrp9 queda `simulado`, `contacto`, confianza ≥ 0,9. Segundo curl → 0 acciones.

### Task 9: Login del panel y Ajustes mínimo

**Files:** Create `src/lib/social/sesion.ts`, `src/app/api/social/sesion/route.ts`, `src/app/social/layout.tsx`, `src/app/social/puerta.tsx`, `src/app/social/menu.tsx`, `src/app/social/ajustes/page.tsx`, `src/app/api/social/ajustes/route.ts`, `src/app/api/social/publicaciones/route.ts`

- [ ] `sesion.ts`: copia de `panel-leads.ts` con `COOKIE="panel_social"`, `path:"/"` (las rutas de API viven en `/api/social`), payload `{panel:"social"}`, env `PANEL_SOCIAL_PASSWORD`; `exigirSesion()` para rutas (lanza 401).
- [ ] Ruta de sesión: copia de `api/servinomic/panel/route.ts` (freno 5 intentos/15 min).
- [ ] `layout.tsx` (servidor, `force-dynamic`, `robots: noindex`): sin sesión → `<Puerta/>`; con sesión → menú lateral (Inicio, Publicaciones, Chats, Por atender, Automatizaciones, Ajustes) + contenido. Paleta SEÑAL (`src/styles/senal.css`).
- [ ] Ajustes: interruptores pausa/simulación, último ciclo, consumo del mes, últimos 30 eventos, botón «Traer publicaciones».
- [ ] Verificación: Playwright — sin cookie muestra la puerta; contraseña errónea → error; correcta → Ajustes; la API `/api/social/ajustes` sin cookie → 401.

### Task 10: Primera vista previa y reloj (fin de fase 1)

- [ ] Variables en Vercel (Preview y Production): `COMPOSIO_CONSUMER_KEY` (de `~/.claude.json`), `TYPESAFE_API_KEY` (**rotada**; si Victor no la rota aún, usar la actual y dejarlo como pendiente visible), `DEEPSEEK_API_KEY`, `PANEL_SOCIAL_PASSWORD` (la elige Victor), `SOCIAL_CRON_SECRET` (`openssl rand -hex 32`), `SOCIAL_SAL` (`openssl rand -hex 16`). Con `vercel env add`.
- [ ] `vercel deploy` (vista previa) → URL. Verificar puerta, Ajustes y `POST /api/social/ciclo` con la clave.
- [ ] cron-job.org: trabajo cada minuto `POST <url>/api/social/ciclo` con la cabecera; otro cada hora a `/api/social/metricas`. (Cuenta de Victor.)
- [ ] Prueba C2 en la vista previa, con la cuenta de prueba de Victor, en una publicación vieja desactivada en el agente local. **Pedir OK para pasar a producción** (`vercel deploy --prod` o push, según decida Victor).

---

## FASE 2 · Panel (Inicio, Publicación, Por atender)

### Task 11: Consultas de lectura
**Files:** Modify `src/lib/social/db.ts` — `resumenInicio(dias)`, `tablaPublicaciones()`, `porAtender()`, `detallePublicacion(id)`, `embudo(id)` (comentaron → mensaje privado → Sí → abrieron landing [`social_visitas` con código] → completaron [`leads.social_codigo` + `completed`]), `comentariosClave(id, filtro)`.

### Task 12: Inicio
**Files:** `src/app/social/page.tsx` + `inicio-kpis.tsx`, `tabla-publicaciones.tsx`, `atencion.tsx`, `recomendaciones.tsx`. Recomendaciones por reglas explícitas en `src/lib/social/recomendaciones.ts` (puro, con prueba): sin landing y ≥ 2 comentarios `quiere_contacto` → «asígnale una landing»; vistas altas y 0 leads → «añade palabra clave»; reloj > 5 min → «el reloj no corre».

### Task 13: Publicación (Resumen y Comentarios)
**Files:** `src/app/social/publicaciones/[id]/page.tsx` + `encabezado.tsx`, `selector.tsx`, `pestanas.tsx`, `kpis.tsx`, `embudo.tsx`, `comentarios-clave.tsx`, `lista-comentarios.tsx`.

### Task 14: Por atender
**Files:** `src/app/social/atender/page.tsx` + `atender-lista.tsx`, `src/app/api/social/comentarios/[id]/route.ts` (aprobar publica con `instagram.responderComentario`; descartar; corregir `tipo_corregido`; reintentar un `error`), mensajes en revisión con envío vía la ruta de Chats.

### Task 15: Oráculo de pantallas
**Files:** `scripts/oraculos/social.mjs` — entra con la contraseña, recorre `/social`, `/social/atender`, una publicación, en 1440 y 390; comprueba cero desbordes horizontales, cero texto fuera de pantalla (alcanzabilidad con `elementFromPoint`, ver memoria), y **control positivo** (un elemento conocido sí se detecta). Añadir a `scripts/oraculos/correr.sh`.

---

## FASE 3 · Chats

### Task 16: API de chats
**Files:** `src/app/api/social/chats/[igsid]/route.ts` (GET: persona + mensajes; al abrir, trae de Instagram los últimos 25 de su conversación y guarda los nuevos), `enviar/route.ts` (POST `{tipo:"texto"|"tarjeta"|"botones", ...}`; valida `ventanaAbierta`; envía; guarda con `origen:"victor"`), `pausa/route.ts` (paso = `revision` fijo, el agente no toca). Lista de conversaciones: personas del flujo **y** conversaciones espontáneas (desde `instagram.conversaciones()` cada vez que se abre Chats, sin respuesta automática, decisión A).

### Task 17: Pantalla Chats
**Files:** `src/app/social/chats/page.tsx` + `lista-chats.tsx` (filtros: te necesitan, del agente, leads, por publicación), `conversacion.tsx`, `editor.tsx` (borrador IA vía `redactor`, insertar tarjeta de la landing de su publicación, botones rápidos, «Enviar a Instagram»), `ficha.tsx` (origen, comentario, rama, landing/visitas, formulario, etiquetas, nota). En 390 px: lista → conversación como pantallas separadas.

### Task 18: Prueba real
- [ ] Desde el panel (vista previa), enviar texto y tarjeta a la cuenta de prueba dentro de su ventana; confirmar llegada en Instagram.

---

## FASE 4 · Automatización

### Task 19: API y lectura de configuración
**Files:** `src/app/api/social/automatizaciones/[id]/route.ts` (GET/PUT con validación: `landingPermitida`, botones ≤ 20 caracteres, umbral 0,5–0,95, textos ≤ 290), `probar/route.ts` (simula un comentario: Jev + decidir + redactar, sin publicar). `ciclo-*.ts` ya leen `textos` de la base (Task 8): verificar que ningún texto quedó fijo en código salvo `TEXTOS_INICIALES`.

### Task 20: Pantalla Automatización
**Files:** `src/app/social/automatizaciones/[id]/page.tsx` + `editor-automatizacion.tsx` (modo, sensible, landing, palabras clave, detectar interés, umbral), `reglas-tipo.tsx`, `flujo.tsx` (diagrama pregunta → 3 ramas, textos editables), `simulador.tsx`, «Duplicar de otra publicación». Guardar = PUT; activar fija `activado_en = now()` y `proxima_revision = now()`.

### Task 21: Prueba
- [ ] Automatizar una publicación nueva solo desde el panel y pasar C2 con la cuenta de prueba.

---

## FASE 5 · Métricas y video

### Task 22: Métricas cada hora
**Files:** `src/lib/social/metricas.ts`, `src/app/api/social/metricas/route.ts` (clave del reloj). Publicaciones con automatización o de ≤ 30 días. Verificar: valores iguales a los de la app para el reel del 20 sep (vistas 35, skip 93,3 % el 27 sep).

### Task 23: Gemini
**Files:** `src/lib/social/gemini.ts` — `analizarVideo(mediaUrl, duracion)`: descarga, sube a la File API (`https://generativelanguage.googleapis.com/upload/v1beta/files`), espera `ACTIVE`, `generateContent` con esquema JSON (`responseMimeType: "application/json"`, `responseSchema`) → `{transcripcion:[{t0,t1,texto}], escenas:[{t0,t1,visual,dicho,texto_pantalla}], gancho:{retencion:{ejes…,total}, moneda_social:{…,total}, aciertos:[], fallos:[]}}`. Los ejes y pesos, de `~/.claude/skills/video-viral/3-rubrica.md`. `leerCurva(imagen)` → `[{s, pct}]`. `src/lib/social/caidas.ts` (puro, con prueba): caídas > 8 puntos en ≤ 3 s, alineadas con escenas.

### Task 24: Pestaña «Video y gancho»
**Files:** `publicaciones/[id]/video-gancho.tsx`, `curva.tsx` (SVG como el diseño; solo si hay curva), `analisis-gancho.tsx`, `caidas.tsx`, ruta `api/social/video/[id]/route.ts` (analizar; subir captura). Sin curva: KPIs de la API + análisis + «Sube la captura de retención de Instagram para ver la curva». Nunca curva inventada.

---

## FASE 6 · Landing

### Task 25: Detección de clics (TDD)
**Files:** `src/lib/social/seguimiento.ts` + prueba: `esClicMuerto(elemento descrito)` (no es a/button/input/select/textarea/label/[role=button] ni dentro de uno), `detectorRabia()` (3 clics ≤ 1 s dentro de 24 px → true).

### Task 26: Componente y ruta de seguimiento
**Files:** `src/components/social/SeguimientoSocial.tsx` (cliente: `?c=` → `sessionStorage`; visita; scroll máximo; `IntersectionObserver` sobre `[data-seccion]`; clics con `sendBeacon`), `src/app/api/social/t/route.ts` (público, cuerpo ≤ 8 KB, valida campos, sin IP guardada; país de `x-vercel-ip-country`). Añadir `data-seccion="…"` a las secciones de la landing delegar y montar el componente en `src/app/servinomic/[campana]/page.tsx`. El formulario envía `social_codigo` (leer de `sessionStorage`) y el paso alcanzado a `/api/social/t`; `api/leads/delegar` guarda `social_codigo`.

### Task 27: Aviso de privacidad
Una línea bajo el formulario: «Medimos cómo se usa esta página para mejorarla.» con enlace a la política existente del sitio (buscar la ruta de legales creada en el spec `2026-09-09-datos-legales.md`).

### Task 28: Pestaña «Landing y mapa de calor» + ficha
**Files:** `publicaciones/[id]/landing.tsx` (hasta dónde bajan por sección, abandono por pregunta, mapa por elemento: lista de elementos con más clics + clics muertos y de rabia, señales), ficha de Chats muestra visitas y paso. Verificación C3.

---

## FASE 7 · Cierre

### Task 29: Pase a producción (con OK)
- [ ] Pedir OK a Victor. Publicar a producción como él decida (push de `feat/social` + merge, o `vercel deploy --prod`). Cambiar las URLs del reloj a `https://calidev.dev`.
- [ ] Desactivar en el agente local todas las publicaciones y activarlas en `/social`.

### Task 30: Prueba final (C1–C4)
- [ ] **C1:** oráculo `social.mjs` sobre producción, 1440 y 390, verde.
- [ ] **C2:** Mac **apagado** (o dormido, con Victor confirmándolo): la cuenta de prueba comenta «ayuda» → respuesta pública + privado con botones en ≤ 2 min → «Sí» → tarjeta.
- [ ] **C3:** la cuenta abre la tarjeta y llena el paso 1 → ficha con visita, scroll y paso.
- [ ] **C4:** `launchctl bootout gui/$(id -u)/dev.calidev.ig-agente` y `…/dev.calidev.n8n`; borrar los plist; `npm uninstall -g n8n` (con OK); `launchctl list | grep calidev` vacío.
- [ ] Actualizar memoria (`project_ig_agente.md`) y el log de Obsidian.
