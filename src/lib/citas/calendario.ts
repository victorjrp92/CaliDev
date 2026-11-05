import { sql } from "@/lib/db";
import { herramienta } from "@/lib/social/composio";
import { registrarEvento, type Cita } from "@/lib/citas/datos";
import { ENLACE_VIDEOLLAMADA, describir, horarioDeCita, tipoDe } from "@/lib/citas/horarios";
import { NOMBRE_PROGRAMA, esSesion, rotuloSesion } from "@/lib/citas/sesion";

/**
 * Cada cita reservada entra al Google Calendar de calidevdev@gmail.com con
 * alarmas 1 hora y 10 minutos antes. Un correo no es una alarma: el 23 oct 2026
 * Víctor no vio el aviso por correo y faltó a una cita. El calendario sí suena
 * en el teléfono.
 *
 * Va por Composio, con la misma cuenta (clave «consumer») que ya usa el agente
 * de Instagram, donde está conectado el calendario. El evento se crea y después
 * se le ponen las alarmas, porque la herramienta de crear no las acepta.
 *
 * `evento_calendario` guarda el id del evento: cambiar la hora lo mueve, borrar
 * la cita lo borra. Nunca lanza: si Google falla, la cita sigue igual y queda
 * anotado en su historial.
 */

const ZONA = "America/Bogota";
const ALARMAS = { useDefault: false, overrides: [{ method: "popup", minutes: 60 }, { method: "popup", minutes: 10 }] };

let columna: Promise<unknown> | null = null;
function asegurarColumna() {
  columna ??= sql`ALTER TABLE citas ADD COLUMN IF NOT EXISTS evento_calendario TEXT`.catch((e) => {
    columna = null;
    throw e;
  });
  return columna;
}

/** «2026-10-26T11:00:00» en hora de Colombia, sin zona: la zona va aparte. */
function local(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`;
}

function datosEvento(cita: Cita) {
  const h = horarioDeCita(cita)!;
  const segunda = tipoDe(cita) === "segunda";
  return {
    summary: `CaliDev · ${cita.nombre} · ${esSesion(cita) ? `${NOMBRE_PROGRAMA} · ${rotuloSesion(cita)} (1 h)` : segunda ? "Cierre (30 min)" : "Diagnóstico (1 h)"}`,
    description: `${describir(h)}\nCorreo: ${cita.correo}\nMeet: ${ENLACE_VIDEOLLAMADA}\nFicha: https://calidev.dev/servinomic/leads`,
    location: ENLACE_VIDEOLLAMADA,
    inicio: local(h.inicio),
    fin: local(h.fin),
  };
}

async function idGuardado(citaId: number): Promise<string | null> {
  await asegurarColumna();
  const r = await sql<{ evento_calendario: string | null }>`SELECT evento_calendario FROM citas WHERE id = ${citaId}`;
  return r.rows[0]?.evento_calendario ?? null;
}

/** Crea o mueve el evento de una cita reservada. */
export async function sincronizarCalendario(cita: Cita): Promise<void> {
  if (!cita.inicio) return;
  try {
    const e = datosEvento(cita);
    const existente = await idGuardado(cita.id);
    let id = existente;
    if (!id) {
      const creado = await herramienta("GOOGLECALENDAR_CREATE_EVENT", {
        calendar_id: "primary",
        summary: e.summary,
        description: e.description,
        location: e.location,
        start_datetime: e.inicio,
        end_datetime: e.fin,
        timezone: ZONA,
        create_meeting_room: false,
        exclude_organizer: true,
        send_updates: "none",
      });
      id = creado?.response_data?.id ?? creado?.id ?? null;
      if (!id) throw new Error(`sin id en la respuesta: ${JSON.stringify(creado).slice(0, 200)}`);
      await sql`UPDATE citas SET evento_calendario = ${id} WHERE id = ${cita.id}`;
    }
    await herramienta("GOOGLECALENDAR_PATCH_EVENT", {
      calendar_id: "primary",
      event_id: id,
      summary: e.summary,
      description: e.description,
      location: e.location,
      start_time: e.inicio,
      end_time: e.fin,
      timezone: ZONA,
      reminders: ALARMAS,
      send_updates: "none",
    });
    await registrarEvento(cita.id, "calendario", existente ? "Evento movido en Google Calendar" : "En Google Calendar, con alarmas 1 h y 10 min antes");
  } catch (err) {
    console.error("calendario:", err);
    await registrarEvento(cita.id, "fallo", `No se pudo poner en Google Calendar: ${String(err).slice(0, 160)}`);
  }
}

/** Borra el evento de una cita que se elimina. */
export async function quitarDelCalendario(cita: Pick<Cita, "id">): Promise<void> {
  try {
    const id = await idGuardado(cita.id);
    if (!id) return;
    await herramienta("GOOGLECALENDAR_DELETE_EVENT", { calendar_id: "primary", event_id: id, send_updates: "none" });
  } catch (err) {
    console.error("calendario (borrar):", err);
  }
}

/** Citas por delante que todavía no están en el calendario (las de antes de esto). */
export async function citasSinCalendario(): Promise<Cita[]> {
  await asegurarColumna();
  const r = await sql<Cita>`SELECT * FROM citas WHERE inicio > NOW() AND evento_calendario IS NULL`;
  return r.rows;
}
