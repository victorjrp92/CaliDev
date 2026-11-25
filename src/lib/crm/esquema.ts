import { sql } from "@/lib/db";

/**
 * Las tablas del CRM (docs/crm/spec.md §4). Todas llevan el prefijo `crm_`:
 * `contactos` ya existe y es el formulario de contacto. Las tablas viejas no
 * se tocan; el CRM las referencia por id desde `crm_personas_ref`.
 *
 * Se crean desde el código, como el resto del sitio: la primera consulta de
 * cada instancia corre los CREATE … IF NOT EXISTS una sola vez.
 *
 * Reglas que viven en la base y no solo en el código:
 * - una oportunidad abierta siempre tiene próximo paso con fecha (CHECK);
 * - la auditoría solo se inserta: un trigger rechaza UPDATE y DELETE;
 * - una referencia a una tabla vieja pertenece a una sola persona (UNIQUE).
 */
let listo: Promise<unknown> | null = null;

export function asegurarEsquema() {
  listo ??= crear().catch((err) => {
    listo = null;
    throw err;
  });
  return listo;
}

async function crear() {
  await sql`
    CREATE TABLE IF NOT EXISTS crm_usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('humano', 'agente')),
      rol TEXT NOT NULL,
      hash_clave TEXT,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      sesion_version INT NOT NULL DEFAULT 1,
      invitacion_hash TEXT,
      invitacion_expira_at TIMESTAMPTZ,
      creado_por INT REFERENCES crm_usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_claves (
      id SERIAL PRIMARY KEY,
      usuario_id INT NOT NULL REFERENCES crm_usuarios(id),
      nombre TEXT NOT NULL,
      prefijo TEXT UNIQUE NOT NULL,
      hash TEXT NOT NULL,
      alcances TEXT[] NOT NULL DEFAULT '{}',
      creada_por INT REFERENCES crm_usuarios(id),
      expira_at TIMESTAMPTZ,
      ultimo_uso_at TIMESTAMPTZ,
      revocada_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_auditoria (
      id BIGSERIAL PRIMARY KEY,
      usuario_id INT REFERENCES crm_usuarios(id),
      origen TEXT NOT NULL CHECK (origen IN ('ui', 'cli', 'agente', 'sistema')),
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id TEXT,
      antes JSONB,
      despues JSONB,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_auditoria_entidad ON crm_auditoria (entidad, entidad_id, at)`;
  await sql`
    CREATE OR REPLACE FUNCTION crm_auditoria_inmutable() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'crm_auditoria solo admite INSERT';
    END $$ LANGUAGE plpgsql`;
  await sql`
    CREATE OR REPLACE TRIGGER crm_auditoria_inmutable BEFORE UPDATE OR DELETE ON crm_auditoria
    FOR EACH ROW EXECUTE FUNCTION crm_auditoria_inmutable()`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_idempotencia (
      usuario_id INT NOT NULL REFERENCES crm_usuarios(id),
      clave TEXT NOT NULL,
      estado INT NOT NULL,
      respuesta JSONB NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (usuario_id, clave)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_empresas (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      nit TEXT,
      pais TEXT,
      sector TEXT,
      tamano TEXT,
      sitio TEXT,
      notas TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS crm_empresas_nombre ON crm_empresas (lower(nombre))`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_personas (
      id SERIAL PRIMARY KEY,
      empresa_id INT REFERENCES crm_empresas(id),
      nombre TEXT NOT NULL,
      correo TEXT,
      whatsapp TEXT,
      igsid TEXT,
      usuario_ig TEXT,
      origen TEXT,
      notas TEXT,
      fusionada_en INT REFERENCES crm_personas(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_personas_correo ON crm_personas (lower(correo))`;
  await sql`CREATE INDEX IF NOT EXISTS crm_personas_whatsapp ON crm_personas (whatsapp)`;
  await sql`CREATE INDEX IF NOT EXISTS crm_personas_igsid ON crm_personas (igsid)`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_personas_ref (
      persona_id INT NOT NULL REFERENCES crm_personas(id),
      tabla TEXT NOT NULL,
      ref_id TEXT NOT NULL,
      PRIMARY KEY (tabla, ref_id)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_personas_ref_persona ON crm_personas_ref (persona_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_oportunidades (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      empresa_id INT REFERENCES crm_empresas(id),
      persona_id INT REFERENCES crm_personas(id),
      producto_id INT,
      etapa TEXT NOT NULL,
      valor_arranque NUMERIC(14,2),
      valor_mensual NUMERIC(14,2),
      moneda TEXT NOT NULL DEFAULT 'COP',
      responsable_id INT REFERENCES crm_usuarios(id),
      proximo_paso TEXT,
      proximo_paso_at TIMESTAMPTZ,
      motivo_perdida TEXT,
      origen TEXT,
      referido_por INT REFERENCES crm_personas(id),
      clave_legado TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT crm_oportunidad_proximo_paso CHECK (
        etapa IN ('ganado', 'perdido', 'pausa') OR (proximo_paso IS NOT NULL AND proximo_paso_at IS NOT NULL)
      ),
      CONSTRAINT crm_oportunidad_perdida CHECK (etapa <> 'perdido' OR motivo_perdida IS NOT NULL)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_oportunidades_etapa ON crm_oportunidades (etapa, proximo_paso_at)`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_etapas_historial (
      id BIGSERIAL PRIMARY KEY,
      oportunidad_id INT NOT NULL REFERENCES crm_oportunidades(id),
      de TEXT,
      a TEXT NOT NULL,
      usuario_id INT REFERENCES crm_usuarios(id),
      at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_etapas_historial_a ON crm_etapas_historial (a, at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_tareas (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      area TEXT NOT NULL,
      entidad TEXT,
      entidad_id TEXT,
      asignada_a INT REFERENCES crm_usuarios(id),
      vence_at TIMESTAMPTZ,
      estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'hecha', 'cancelada')),
      creada_por INT REFERENCES crm_usuarios(id),
      cerrada_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_tareas_abiertas ON crm_tareas (estado, vence_at)`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_notas (
      id SERIAL PRIMARY KEY,
      entidad TEXT NOT NULL,
      entidad_id TEXT NOT NULL,
      autor_id INT REFERENCES crm_usuarios(id),
      tipo TEXT NOT NULL DEFAULT 'nota' CHECK (tipo IN ('nota', 'brief', 'resumen_llamada')),
      cuerpo TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_notas_entidad ON crm_notas (entidad, entidad_id, created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_aprobaciones (
      id SERIAL PRIMARY KEY,
      solicitante_id INT NOT NULL REFERENCES crm_usuarios(id),
      tipo TEXT NOT NULL,
      payload JSONB NOT NULL,
      vista_previa TEXT NOT NULL,
      entidad TEXT,
      entidad_id TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'ejecutada', 'fallida')),
      decidido_por INT REFERENCES crm_usuarios(id),
      decidido_at TIMESTAMPTZ,
      motivo TEXT,
      resultado JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Candados y marcas de tiempo de procesos (p. ej. el backfill, que corre como mucho una vez por minuto).
  await sql`
    CREATE TABLE IF NOT EXISTS crm_procesos (
      clave TEXT PRIMARY KEY,
      ultimo_at TIMESTAMPTZ,
      hasta TIMESTAMPTZ,
      resultado JSONB
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_aprobaciones_estado ON crm_aprobaciones (estado, created_at)`;

  // Contratos (1b). El texto y las firmas siguen en las tablas viejas
  // `contratos` y `contrato_firmantes`; aquí solo se une cada contrato con su
  // oportunidad, persona y empresa. Sin FK a `contratos`: esa tabla la crea su
  // propio módulo y puede no existir todavía cuando corre este esquema.
  await sql`
    CREATE TABLE IF NOT EXISTS crm_contratos (
      contrato_id INT PRIMARY KEY,
      oportunidad_id INT REFERENCES crm_oportunidades(id),
      persona_id INT REFERENCES crm_personas(id),
      empresa_id INT REFERENCES crm_empresas(id),
      plantilla TEXT NOT NULL,
      creado_por INT REFERENCES crm_usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_contratos_oportunidad ON crm_contratos (oportunidad_id)`;
  await sql`CREATE INDEX IF NOT EXISTS crm_contratos_persona ON crm_contratos (persona_id)`;
  // Cada envío del enlace de firma por correo, salga o no.
  await sql`
    CREATE TABLE IF NOT EXISTS crm_contrato_envios (
      id SERIAL PRIMARY KEY,
      contrato_id INT NOT NULL,
      firmante_id INT NOT NULL,
      correo TEXT NOT NULL,
      enviado_por INT REFERENCES crm_usuarios(id),
      ok BOOLEAN NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_contrato_envios_contrato ON crm_contrato_envios (contrato_id, at)`;

  await finanzas();
}

/**
 * Finanzas y productos (1c). Convención de tasas en `crm_cobros` y
 * `crm_gastos`: `tasa_eur` = pesos por 1 EUR ese día y `tasa_cop` = pesos por
 * 1 unidad de la moneda del registro (1 si es COP). Así cualquier valor pasa
 * a COP (valor × tasa_cop) o a EUR (valor × tasa_cop / tasa_eur) sin volver
 * a pedir la tasa.
 */
async function finanzas() {
  await sql`
    CREATE TABLE IF NOT EXISTS crm_productos (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS crm_productos_nombre ON crm_productos (lower(nombre))`;
  // El precio publicado. Cambiarlo cierra la vigencia del anterior: el historial no se pisa.
  await sql`
    CREATE TABLE IF NOT EXISTS crm_precios (
      id SERIAL PRIMARY KEY,
      producto_id INT NOT NULL REFERENCES crm_productos(id),
      concepto TEXT NOT NULL CHECK (concepto IN ('arranque', 'mensualidad', 'persona_adicional')),
      valor NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
      moneda TEXT NOT NULL CHECK (moneda IN ('COP', 'EUR', 'USD')),
      incluye TEXT,
      vigente_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      vigente_hasta TIMESTAMPTZ,
      creado_por INT REFERENCES crm_usuarios(id)
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS crm_precios_vigente ON crm_precios (producto_id, concepto) WHERE vigente_hasta IS NULL`;
  await sql`
    CREATE TABLE IF NOT EXISTS crm_promos (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      producto_id INT REFERENCES crm_productos(id),
      concepto TEXT NOT NULL CHECK (concepto IN ('arranque', 'mensualidad', 'persona_adicional')),
      porcentaje NUMERIC(5,2) CHECK (porcentaje > 0 AND porcentaje <= 100),
      valor NUMERIC(14,2) CHECK (valor > 0),
      vigente_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      vigente_hasta TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT crm_promo_una_forma CHECK ((porcentaje IS NULL) <> (valor IS NULL))
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS crm_promos_codigo ON crm_promos (lower(codigo))`;

  // El precio pactado con el cliente, que puede no ser el publicado.
  await sql`
    CREATE TABLE IF NOT EXISTS crm_suscripciones (
      id SERIAL PRIMARY KEY,
      empresa_id INT NOT NULL REFERENCES crm_empresas(id),
      persona_id INT REFERENCES crm_personas(id),
      producto_id INT NOT NULL REFERENCES crm_productos(id),
      oportunidad_id INT REFERENCES crm_oportunidades(id),
      contrato_id INT,
      valor_arranque NUMERIC(14,2),
      valor_mensual NUMERIC(14,2) NOT NULL CHECK (valor_mensual >= 0),
      moneda TEXT NOT NULL CHECK (moneda IN ('COP', 'EUR', 'USD')),
      personas INT,
      permanencia_hasta DATE,
      inicio DATE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cancelada')),
      creado_por INT REFERENCES crm_usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Ganar dos veces la misma oportunidad no crea dos suscripciones.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS crm_suscripciones_oportunidad ON crm_suscripciones (oportunidad_id) WHERE oportunidad_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS crm_suscripciones_empresa ON crm_suscripciones (empresa_id, estado)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_cobros (
      id SERIAL PRIMARY KEY,
      empresa_id INT NOT NULL REFERENCES crm_empresas(id),
      persona_id INT REFERENCES crm_personas(id),
      suscripcion_id INT REFERENCES crm_suscripciones(id),
      concepto TEXT NOT NULL CHECK (concepto IN ('arranque', 'cuota', 'mensualidad', 'otro')),
      descripcion TEXT,
      valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
      moneda TEXT NOT NULL CHECK (moneda IN ('COP', 'EUR', 'USD')),
      tasa_eur NUMERIC(14,4) NOT NULL CHECK (tasa_eur > 0),
      tasa_cop NUMERIC(14,4) NOT NULL CHECK (tasa_cop > 0),
      vence_at DATE NOT NULL,
      pagado_at TIMESTAMPTZ,
      metodo TEXT NOT NULL CHECK (metodo IN ('stripe', 'transferencia', 'efectivo')),
      payment_link_id TEXT UNIQUE,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
      motivo_anulacion TEXT,
      creado_por INT REFERENCES crm_usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT crm_cobro_pagado CHECK ((estado = 'pagado') = (pagado_at IS NOT NULL)),
      CONSTRAINT crm_cobro_stripe CHECK (metodo <> 'stripe' OR moneda <> 'COP')
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_cobros_estado ON crm_cobros (estado, vence_at)`;
  await sql`CREATE INDEX IF NOT EXISTS crm_cobros_empresa ON crm_cobros (empresa_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_gastos (
      id SERIAL PRIMARY KEY,
      fecha DATE NOT NULL,
      proveedor TEXT NOT NULL,
      concepto TEXT NOT NULL,
      valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
      moneda TEXT NOT NULL CHECK (moneda IN ('COP', 'EUR', 'USD')),
      tasa_eur NUMERIC(14,4) NOT NULL CHECK (tasa_eur > 0),
      tasa_cop NUMERIC(14,4) NOT NULL CHECK (tasa_cop > 0),
      empresa_id INT REFERENCES crm_empresas(id),
      recurrente BOOLEAN NOT NULL DEFAULT FALSE,
      creado_por INT REFERENCES crm_usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS crm_gastos_fecha ON crm_gastos (fecha)`;

  // Caché de tasas por día: pesos por 1 unidad de `moneda`.
  await sql`
    CREATE TABLE IF NOT EXISTS crm_tasas (
      dia DATE NOT NULL,
      moneda TEXT NOT NULL CHECK (moneda IN ('EUR', 'USD')),
      cop NUMERIC(14,4) NOT NULL CHECK (cop > 0),
      fuente TEXT NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (dia, moneda)
    )`;

  // Catálogo inicial (spec §4): los precios publicados de ServiNomic y la promo de captura.
  // Solo se siembra lo que falta; lo que Victor o Karen cambien después no se pisa.
  const { rows } = await sql<{ id: number }>`
    INSERT INTO crm_productos (nombre, descripcion)
    VALUES ('ServiNomic', 'Sistema de operación para empresas de servicios: nómina, operación, clientes, pagos y sedes')
    ON CONFLICT (lower(nombre)) DO UPDATE SET nombre = crm_productos.nombre
    RETURNING id`;
  const p = rows[0].id;
  await sql`
    INSERT INTO crm_precios (producto_id, concepto, valor, moneda, incluye)
    SELECT ${p}, c.concepto, c.valor, 'COP', c.incluye
    FROM (VALUES ('arranque', 2500000, 'Pago único'), ('mensualidad', 250000, 'Hasta 10 personas'), ('persona_adicional', 15000, 'Por persona al mes'))
      AS c(concepto, valor, incluye)
    WHERE NOT EXISTS (SELECT 1 FROM crm_precios x WHERE x.producto_id = ${p} AND x.concepto = c.concepto)`;
  await sql`
    INSERT INTO crm_promos (codigo, descripcion, producto_id, concepto, porcentaje)
    VALUES ('captura', '15 % de descuento en el arranque de ServiNomic', ${p}, 'arranque', 15)
    ON CONFLICT (lower(codigo)) DO NOTHING`;
}
