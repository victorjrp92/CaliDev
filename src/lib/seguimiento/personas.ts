import { sql } from "@/lib/db";
import { eventosDeCitas, todasLasCitas, type Cita, type EventoCita } from "@/lib/citas/datos";
import { describir, horaEnFrankfurt, horarioDeCita, tipoDe } from "@/lib/citas/horarios";
import { etiquetaDelegar } from "@/lib/delegar/preguntas";
import { labelFor } from "@/lib/leads";
import { todosLosSeguimientos, type Seguimiento } from "@/lib/seguimiento/datos";

/**
 * El seguimiento de cada persona hasta el cierre, armado de lo que ya existe:
 * su formulario (tabla `leads`), sus citas (`citas`), los correos de cada cita
 * (`citas_eventos`) y lo que Víctor marca a mano (`seguimiento`).
 *
 * Todo se junta por el correo, en minúsculas; quien no dejó correo se junta por
 * su WhatsApp. Así una persona que llenó el formulario y después fue invitada a
 * dos citas aparece una sola vez, con su historia completa.
 */

export type EstadoPaso = "hecho" | "actual" | "pendiente";
export type Paso = { clave: string; nombre: string; estado: EstadoPaso; fecha: string | null; detalle?: string };

export type Etapa =
  | "por-invitar"
  | "esperando-hora-1"
  | "cita-1"
  | "por-invitar-2"
  | "esperando-hora-2"
  | "cita-2"
  | "por-proponer"
  | "propuesta"
  | "ganado"
  | "perdido"
  | "pausa";

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  "por-invitar": "Por invitar",
  "esperando-hora-1": "Esperando que elija hora",
  "cita-1": "1.ª cita agendada",
  "por-invitar-2": "Invitar a 2.ª cita",
  "esperando-hora-2": "Esperando hora de 2.ª cita",
  "cita-2": "2.ª cita agendada",
  "por-proponer": "Enviar propuesta",
  propuesta: "Propuesta enviada",
  ganado: "Ganado",
  perdido: "Perdido",
  pausa: "En pausa",
};

export type DatoLead = { etiqueta: string; valor: string };

export type Persona = {
  clave: string;
  nombre: string;
  correo: string | null;
  whatsapp: string | null;
  empresa: string | null;
  origen: string;
  formulario: { fecha: string; prioridad: string | null; motivo: string | null; datos: DatoLead[] } | null;
  primera: Cita | null;
  segunda: Cita | null;
  /** La cita que se puede agendar o mover a mano: la más avanzada que aún no pasó. */
  vigente: Cita | null;
  eventos: (EventoCita & { cita: "1.ª" | "2.ª" })[];
  seguimiento: Seguimiento | null;
  etapa: Etapa;
  pasos: Paso[];
  proximo: string;
  /** Para ordenar: lo que pide atención primero va arriba. */
  urgencia: number;
  ultimaActividad: number;
};

type FilaLead = {
  id: number;
  created_at: string;
  campaign: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  variante: string | null;
  role: string | null;
  staff: string | null;
  actividad: string | null;
  dolor: string | null;
  dolor_otro: string | null;
  herramientas: string | null;
  busca: string | null;
  plazo: string | null;
  prioridad: string | null;
  prioridad_motivo: string | null;
  freno: string | null;
  repetitivo: string | null;
  urgency: string | null;
  completed: boolean;
};

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
const corta = (d: string | Date) => FECHA.format(new Date(d));
const clavePor = (correo: string | null, whatsapp: string | null) =>
  correo ? correo.trim().toLowerCase() : `wa:${(whatsapp ?? "").replace(/\D/g, "")}`;

function datosDelLead(l: FilaLead): DatoLead[] {
  if (l.variante) {
    return [
      { etiqueta: "Negocio", valor: l.actividad ?? "—" },
      { etiqueta: "Resolver primero", valor: etiquetaDelegar("dolor", l.dolor) + (l.dolor_otro ? `: ${l.dolor_otro}` : "") },
      { etiqueta: "Equipo", valor: etiquetaDelegar("tamano", l.staff) },
      { etiqueta: "Organiza con", valor: etiquetaDelegar("herramientas", l.herramientas) },
      { etiqueta: "Busca", valor: etiquetaDelegar("busca", l.busca) },
      { etiqueta: "Plazo", valor: etiquetaDelegar("plazo", l.plazo) },
    ];
  }
  return [
    { etiqueta: "Le frena", valor: labelFor("freno", l.freno) },
    { etiqueta: "Horas repetitivas", valor: labelFor("repetitivo", l.repetitivo) },
    { etiqueta: "Equipo", valor: labelFor("staff", l.staff) },
    { etiqueta: "Con qué trabaja", valor: labelFor("herramientas", l.herramientas) },
  ];
}

/** Estado de una cita para la línea de etapas. */
function pasosDeCita(c: Cita | null, n: "1.ª" | "2.ª", eventos: EventoCita[], ahora: number): Paso[] {
  const h = c ? horarioDeCita(c) : undefined;
  const recordatorios = eventos.filter((e) => e.tipo === "recordatorio");
  const ultimoRecordatorio = recordatorios.at(-1)?.created_at ?? c?.recordatorio_at ?? null;
  return [
    { clave: `inv-${n}`, nombre: `Invitación ${n} cita`, estado: c ? "hecho" : "pendiente", fecha: c?.created_at ?? null },
    {
      clave: `rec-${n}`,
      nombre: "Recordatorio",
      estado: ultimoRecordatorio ? "hecho" : "pendiente",
      fecha: ultimoRecordatorio,
      detalle: recordatorios.length > 1 ? `${recordatorios.length} enviados` : undefined,
    },
    {
      clave: `cita-${n}`,
      nombre: `${n} cita`,
      estado: h ? (h.fin.getTime() < ahora ? "hecho" : "actual") : "pendiente",
      fecha: h ? h.inicio.toISOString() : null,
      detalle: h && h.fin.getTime() >= ahora ? horaEnFrankfurt(h) : undefined,
    },
  ];
}

export async function armarPersonas(): Promise<Persona[]> {
  const [leadsR, citas, eventos, seguimientos] = await Promise.all([
    sql<FilaLead>`SELECT * FROM leads WHERE name NOT LIKE 'PRUEBA CLAUDE%' ORDER BY created_at`,
    todasLasCitas(),
    eventosDeCitas().catch(() => [] as EventoCita[]),
    todosLosSeguimientos().catch(() => new Map<string, Seguimiento>()),
  ]);
  const ahora = Date.now();

  type Grupo = { leads: FilaLead[]; citas: Cita[] };
  const grupos = new Map<string, Grupo>();
  const grupo = (k: string) => {
    if (!grupos.has(k)) grupos.set(k, { leads: [], citas: [] });
    return grupos.get(k)!;
  };
  for (const l of leadsR.rows) grupo(clavePor(l.email, l.whatsapp)).leads.push(l);
  // Una cita se une al lead que dejó ese mismo correo; si no lo hay, es su propia persona.
  for (const c of [...citas].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))) {
    grupo(clavePor(c.correo, null)).citas.push(c);
  }

  const personas: Persona[] = [];
  for (const [clave, g] of grupos) {
    const lead = g.leads.at(-1) ?? null;
    // La cita vigente de cada tipo es la última creada.
    const primera = g.citas.filter((c) => tipoDe(c) === "primera").at(-1) ?? null;
    const segunda = g.citas.filter((c) => tipoDe(c) === "segunda").at(-1) ?? null;
    const evDe = (c: Cita | null) => (c ? eventos.filter((e) => e.cita_id === c.id) : []);
    const seg = seguimientos.get(clave) ?? null;

    const pasos: Paso[] = [
      { clave: "lead", nombre: "Formulario", estado: lead ? "hecho" : "pendiente", fecha: lead?.created_at ?? null },
      ...pasosDeCita(primera, "1.ª", evDe(primera), ahora),
      ...pasosDeCita(segunda, "2.ª", evDe(segunda), ahora),
      {
        clave: "propuesta",
        nombre: "Propuesta",
        estado: seg?.etapa && seg.etapa !== "pausa" ? "hecho" : "pendiente",
        fecha: seg?.etapa === "propuesta" ? seg.etapa_at : null,
      },
      {
        clave: "cierre",
        nombre: seg?.etapa === "perdido" ? "Perdido" : "Cierre",
        estado: seg?.etapa === "ganado" || seg?.etapa === "perdido" ? "hecho" : "pendiente",
        fecha: seg?.etapa === "ganado" || seg?.etapa === "perdido" ? seg.etapa_at : null,
      },
    ];
    // Si la persona llegó por invitación directa (Instagram), no hay formulario: el paso se omite.
    const visibles = lead ? pasos : pasos.filter((p) => p.clave !== "lead");

    const h1 = primera ? horarioDeCita(primera) : undefined;
    const h2 = segunda ? horarioDeCita(segunda) : undefined;
    const recordatorioAuto = (c: Cita) => {
      if (c.recordatorio_at) return `recordatorio enviado el ${corta(c.recordatorio_at)}`;
      const m = new Date(+new Date(c.created_at) + 20 * 3600e3);
      const d = new Date(m);
      d.setUTCHours(14, 0, 0, 0);
      if (+d < +m) d.setUTCDate(d.getUTCDate() + 1);
      return `recordatorio automático el ${corta(d)}`;
    };

    let etapa: Etapa;
    let proximo: string;
    let urgencia: number;
    if (seg?.etapa === "ganado") [etapa, proximo, urgencia] = ["ganado", "Cliente cerrado.", 90];
    else if (seg?.etapa === "perdido") [etapa, proximo, urgencia] = ["perdido", "Cerrado sin venta.", 95];
    else if (seg?.etapa === "pausa") [etapa, proximo, urgencia] = ["pausa", "En pausa: retomar cuando ella escriba.", 80];
    else if (seg?.etapa === "propuesta") [etapa, proximo, urgencia] = ["propuesta", "Esperar decisión: seguimiento a los 2 días, a la semana y cierre de expediente a las 2 semanas.", 30];
    else if (segunda && h2 && h2.fin.getTime() >= ahora)
      [etapa, proximo, urgencia] = ["cita-2", `2.ª cita: ${describir(h2)} · ${horaEnFrankfurt(h2)}.`, 10];
    else if (segunda && h2) [etapa, proximo, urgencia] = ["por-proponer", "Ya fue la 2.ª cita: enviar la propuesta formal con presupuesto y marcarla aquí.", 5];
    else if (segunda) [etapa, proximo, urgencia] = ["esperando-hora-2", `Invitada a la 2.ª cita, no ha elegido hora; ${recordatorioAuto(segunda)}.`, 20];
    else if (primera && h1 && h1.fin.getTime() >= ahora)
      [etapa, proximo, urgencia] = ["cita-1", `1.ª cita: ${describir(h1)} · ${horaEnFrankfurt(h1)}.`, 10];
    else if (primera && h1) [etapa, proximo, urgencia] = ["por-invitar-2", "Ya fue la 1.ª cita: invitarla a la 2.ª cita para presentar la propuesta.", 5];
    else if (primera) [etapa, proximo, urgencia] = ["esperando-hora-1", `Invitada, no ha elegido hora; ${recordatorioAuto(primera)}.`, 20];
    else [etapa, proximo, urgencia] = ["por-invitar", "Escribirle por WhatsApp o invitarla a la 1.ª videollamada.", 1];

    const fechas = [
      lead?.created_at,
      ...g.citas.flatMap((c) => [c.created_at, c.reservada_at, c.recordatorio_at]),
      ...g.citas.flatMap((c) => evDe(c).map((e) => e.created_at)),
      seg?.updated_at,
    ].filter(Boolean) as string[];

    personas.push({
      clave,
      nombre: lead?.name ?? segunda?.nombre ?? primera?.nombre ?? clave,
      correo: lead?.email ?? primera?.correo ?? segunda?.correo ?? null,
      whatsapp: lead?.whatsapp ?? null,
      empresa: lead?.company ?? null,
      origen: lead ? "Formulario de la landing" : "Instagram (invitación directa)",
      formulario: lead
        ? { fecha: lead.created_at, prioridad: lead.prioridad, motivo: lead.prioridad_motivo, datos: datosDelLead(lead) }
        : null,
      primera,
      segunda,
      vigente: [segunda, primera].find((c) => c && (!c.inicio || +new Date(c.inicio) > ahora)) ?? null,
      eventos: [
        ...evDe(primera).map((e) => ({ ...e, cita: "1.ª" as const })),
        ...evDe(segunda).map((e) => ({ ...e, cita: "2.ª" as const })),
      ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
      seguimiento: seg,
      etapa,
      pasos: visibles,
      proximo,
      urgencia,
      ultimaActividad: Math.max(...fechas.map((f) => +new Date(f))),
    });
  }

  return personas.sort((a, b) => a.urgencia - b.urgencia || b.ultimaActividad - a.ultimaActividad);
}
