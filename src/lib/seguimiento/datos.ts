import { sql } from "@/lib/db";

/**
 * Lo que solo Víctor sabe y el sistema no puede deducir: si ya envió la
 * propuesta, si el cliente cerró, si lo perdió o lo dejó en pausa, y sus
 * notas. Una fila por persona; la clave es su correo (o su WhatsApp si no dejó
 * correo), la misma con la que se juntan formulario y citas.
 */

export type EtapaManual = "propuesta" | "ganado" | "perdido" | "pausa";
export const ETAPAS_MANUALES: EtapaManual[] = ["propuesta", "ganado", "perdido", "pausa"];

export type Seguimiento = {
  clave: string;
  etapa: EtapaManual | null;
  nota: string | null;
  etapa_at: string | null;
  updated_at: string;
};

let tabla: Promise<unknown> | null = null;
function asegurarTabla() {
  tabla ??= sql`
    CREATE TABLE IF NOT EXISTS seguimiento (
      clave TEXT PRIMARY KEY,
      etapa TEXT,
      nota TEXT,
      etapa_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch((err) => {
    tabla = null;
    throw err;
  });
  return tabla;
}

export async function todosLosSeguimientos(): Promise<Map<string, Seguimiento>> {
  await asegurarTabla();
  const r = await sql<Seguimiento>`SELECT * FROM seguimiento`;
  return new Map(r.rows.map((s) => [s.clave, s]));
}

/** Cambia la etapa (o la quita con `null`). La fecha de la etapa es la del cambio. */
export async function guardarEtapa(clave: string, etapa: EtapaManual | null): Promise<void> {
  await asegurarTabla();
  await sql`
    INSERT INTO seguimiento (clave, etapa, etapa_at, updated_at)
    VALUES (${clave}, ${etapa}, ${etapa ? new Date().toISOString() : null}, NOW())
    ON CONFLICT (clave) DO UPDATE SET
      etapa = EXCLUDED.etapa, etapa_at = EXCLUDED.etapa_at, updated_at = NOW()
  `;
}

export async function guardarNota(clave: string, nota: string | null): Promise<void> {
  await asegurarTabla();
  await sql`
    INSERT INTO seguimiento (clave, nota, updated_at) VALUES (${clave}, ${nota}, NOW())
    ON CONFLICT (clave) DO UPDATE SET nota = EXCLUDED.nota, updated_at = NOW()
  `;
}
