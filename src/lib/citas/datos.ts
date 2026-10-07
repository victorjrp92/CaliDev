import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";

/**
 * Citas de videollamada en la base.
 *
 * Una fila por invitación. `token` es el enlace personal de la persona: quien
 * lo tiene puede reservar o cambiar SU cita, nada más. `inicio` es la hora
 * reservada, o `null` mientras no elija.
 *
 * El índice único sobre `inicio` es lo que impide que dos personas tomen la
 * misma hora: si dos confirman a la vez, la base acepta una y rechaza la otra,
 * sin depender de que el código compruebe antes.
 *
 * `secuencia` sube cada vez que la persona cambia de hora: los calendarios la
 * usan para reemplazar el evento anterior en vez de duplicarlo.
 *
 * `avisos` son los ids de Resend de los correos programados para antes de la
 * cita (24 horas y 1 hora antes, a la persona y a Víctor), separados por coma.
 * Se guardan para poder cancelarlos si cambia la hora o se borra la cita.
 *
 * `recordatorio_at` es cuándo salió el recordatorio a quien no eligió hora
 * (uno solo por invitación; ver api/citas/recordatorios).
 *
 * `tipo` es «primera» (videollamada de diagnóstico, 1 hora) o «segunda» (la
 * presentación de la propuesta, 30 minutos); vacío = primera. `mensaje` es una
 * nota de Víctor que encabeza la invitación (por ejemplo, por qué cambia una
 * hora ya acordada).
 *
 * `horarios` son los que Víctor le ofreció a esta persona, como ids separados
 * por coma («2026-10-01T09,2026-10-01T10»). Vacío en las primeras invitaciones,
 * que usan la lista fija de lib/citas/horarios.ts.
 */

export type Cita = {
  id: number;
  token: string;
  nombre: string;
  correo: string;
  inicio: string | null;
  secuencia: number;
  horarios: string | null;
  tipo: string | null;
  mensaje: string | null;
  recordatorio_at: string | null;
  avisos: string | null;
  reservada_at: string | null;
  created_at: string;
};

let tabla: Promise<unknown> | null = null;
function asegurarTabla() {
  tabla ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        inicio TIMESTAMPTZ,
        secuencia INT NOT NULL DEFAULT 0,
        reservada_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS citas_inicio_unico ON citas (inicio) WHERE inicio IS NOT NULL`;
    await sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS horarios TEXT`;
    await sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS recordatorio_at TIMESTAMPTZ`;
    await sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS avisos TEXT`;
    await sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS tipo TEXT`;
    await sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS mensaje TEXT`;
    await sql`
      CREATE TABLE IF NOT EXISTS citas_eventos (
        id SERIAL PRIMARY KEY,
        cita_id INT NOT NULL,
        tipo TEXT NOT NULL,
        detalle TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  })().catch((err) => {
    tabla = null;
    throw err;
  });
  return tabla;
}

export async function crearCita(
  nombre: string,
  correo: string,
  horarios: string[],
  extra: { tipo?: "primera" | "segunda"; mensaje?: string | null } = {}
): Promise<Cita> {
  await asegurarTabla();
  const token = randomBytes(16).toString("hex");
  const r = await sql<Cita>`
    INSERT INTO citas (token, nombre, correo, horarios, tipo, mensaje)
    VALUES (${token}, ${nombre}, ${correo}, ${horarios.join(",")}, ${extra.tipo ?? "primera"}, ${extra.mensaje ?? null})
    RETURNING *
  `;
  return r.rows[0];
}

export async function citaPorToken(token: string): Promise<Cita | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  await asegurarTabla();
  const r = await sql<Cita>`SELECT * FROM citas WHERE token = ${token}`;
  return r.rows[0] ?? null;
}

/** Las horas ya tomadas por otras personas. */
export async function horasOcupadas(excepto?: number): Promise<number[]> {
  await asegurarTabla();
  const r = await sql<{ inicio: string }>`
    SELECT inicio FROM citas WHERE inicio IS NOT NULL AND id <> ${excepto ?? 0}
  `;
  return r.rows.map((f) => new Date(f.inicio).getTime());
}

export type ResultadoReserva = { ok: true; cita: Cita; cambio: boolean } | { ok: false; motivo: "ocupado" };

export async function reservar(cita: Cita, inicio: Date): Promise<ResultadoReserva> {
  await asegurarTabla();
  const cambio = cita.inicio !== null;
  try {
    const r = await sql<Cita>`
      UPDATE citas SET
        inicio = ${inicio.toISOString()},
        secuencia = secuencia + ${cambio ? 1 : 0},
        reservada_at = NOW()
      WHERE id = ${cita.id}
      RETURNING *
    `;
    return { ok: true, cita: r.rows[0], cambio };
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return { ok: false, motivo: "ocupado" };
    throw err;
  }
}

export async function todasLasCitas(): Promise<Cita[]> {
  await asegurarTabla();
  const r = await sql<Cita>`SELECT * FROM citas ORDER BY created_at DESC`;
  return r.rows;
}

/** Borra una invitación y libera su hora. Solo desde el panel. */
export async function borrarCita(id: number): Promise<boolean> {
  await asegurarTabla();
  const r = await sql`DELETE FROM citas WHERE id = ${id}`;
  return (r.rowCount ?? 0) > 0;
}

/**
 * Invitaciones que llevan al menos 20 horas sin hora elegida y todavía no
 * recibieron recordatorio. La tarea corre una vez al día, a las 9 a. m. de
 * Colombia (el plan gratuito de Vercel no permite más): con 20 horas, quien fue
 * invitado ayer recibe el recordatorio esta mañana. El tope de 7 días evita
 * escribirle a alguien por una invitación vieja si la tarea estuvo parada.
 */
export async function citasParaRecordar(): Promise<Cita[]> {
  await asegurarTabla();
  const r = await sql<Cita>`
    SELECT * FROM citas
    WHERE inicio IS NULL
      AND recordatorio_at IS NULL
      AND created_at <= NOW() - INTERVAL '20 hours'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at
  `;
  return r.rows;
}

/** Marca el recordatorio como enviado. Solo si sigue sin hora ni recordatorio: evita dobles. */
export async function marcarRecordatorio(id: number): Promise<boolean> {
  const r = await sql`
    UPDATE citas SET recordatorio_at = NOW()
    WHERE id = ${id} AND inicio IS NULL AND recordatorio_at IS NULL
  `;
  return (r.rowCount ?? 0) > 0;
}

export async function citaPorId(id: number): Promise<Cita | null> {
  await asegurarTabla();
  const r = await sql<Cita>`SELECT * FROM citas WHERE id = ${id}`;
  return r.rows[0] ?? null;
}

export async function guardarAvisos(id: number, ids: string[]): Promise<void> {
  await asegurarTabla();
  await sql`UPDATE citas SET avisos = ${ids.length ? ids.join(",") : null} WHERE id = ${id}`;
}

/** Citas reservadas, todavía por delante, sin avisos programados (las anteriores a esta función). */
export async function citasSinAvisos(): Promise<Cita[]> {
  await asegurarTabla();
  const r = await sql<Cita>`
    SELECT * FROM citas
    WHERE inicio IS NOT NULL AND inicio > NOW() + INTERVAL '1 hour' AND avisos IS NULL
  `;
  return r.rows;
}

/**
 * Historial de una cita: cada correo enviado (invitación, recordatorio,
 * confirmación, avisos programados) y cada cambio de hora queda anotado con su
 * fecha. Es lo que muestra el panel de seguimiento; sin esto, «¿le llegó algo?»
 * no tiene respuesta.
 */
export type EventoCita = { id: number; cita_id: number; tipo: string; detalle: string | null; created_at: string };

export async function registrarEvento(citaId: number, tipo: string, detalle?: string | null): Promise<void> {
  try {
    await asegurarTabla();
    await sql`INSERT INTO citas_eventos (cita_id, tipo, detalle) VALUES (${citaId}, ${tipo}, ${detalle ?? null})`;
  } catch (err) {
    console.error("No se pudo registrar el evento", tipo, err);
  }
}

export async function eventosDeCitas(): Promise<EventoCita[]> {
  await asegurarTabla();
  const r = await sql<EventoCita>`SELECT * FROM citas_eventos ORDER BY created_at`;
  return r.rows;
}

/** Añade un horario a los ofrecidos de una cita (al agendar a mano una hora que no estaba). */
export async function agregarHorario(id: number, horarioId: string): Promise<void> {
  await asegurarTabla();
  await sql`
    UPDATE citas SET horarios = CASE
      WHEN horarios IS NULL OR horarios = '' THEN ${horarioId}
      WHEN position(${horarioId} in horarios) > 0 THEN horarios
      ELSE horarios || ',' || ${horarioId} END
    WHERE id = ${id}
  `;
}

