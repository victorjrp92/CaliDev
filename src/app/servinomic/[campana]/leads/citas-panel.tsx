import { todasLasCitas, type Cita } from "@/lib/citas/datos";
import { describir, horaEnFrankfurt, horarioDeCita, horariosDeCita, idDesdeInicio, tipoDe, type TipoCita } from "@/lib/citas/horarios";
import { InvitarCita } from "./invitar-cita";
import { BorrarCita } from "./borrar-cita";
import { RecordarCita } from "./recordar-cita";

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Europe/Berlin" });

/** Estado de quien no ha elegido hora: si ya se le recordó, o cuándo sale el recordatorio automático. */
function estadoRecordatorio(c: Cita): string {
  if (c.recordatorio_at) return `Recordatorio enviado el ${FECHA.format(new Date(c.recordatorio_at))}`;
  // La tarea corre a diario a las 14:00 UTC (9 a. m. de Colombia) y toma a quien
  // lleve más de 20 horas: la primera pasada que cumple eso es el envío.
  const minimo = new Date(c.created_at).getTime() + 20 * 60 * 60 * 1000;
  const pasada = new Date(minimo);
  pasada.setUTCHours(14, 0, 0, 0);
  if (pasada.getTime() < minimo) pasada.setUTCDate(pasada.getUTCDate() + 1);
  return `Recordatorio automático el ${FECHA.format(pasada)} (hora de Frankfurt)`;
}

/**
 * Una sección del panel por tipo de cita (primeras videollamadas, segundas
 * citas): el formulario para invitar y la lista de
 * invitaciones con su estado (sin elegir, o la hora que eligieron, también en
 * hora de Frankfurt, que es la de Víctor).
 */
const TEXTOS: Record<TipoCita, { titulo: string; ayuda: string }> = {
  primera: {
    titulo: "Videollamadas",
    ayuda: "Primera conversación (1 hora). Elige los horarios que le ofreces y envíale el correo para que reserve uno.",
  },
  segunda: {
    titulo: "Segundas citas",
    ayuda: "Presentación de la propuesta (30 minutos), con quien ya tuvo la primera. Si cambias una hora ya acordada, explícalo en el mensaje.",
  },
};

export async function CitasPanel({ campana, tipo }: { campana: string; tipo: TipoCita }) {
  let citas: Cita[] = [];
  let fallo = false;
  try {
    citas = await todasLasCitas();
  } catch {
    fallo = true;
  }

  // Las horas ocupadas cuentan todas las citas, de los dos tipos: una hora
  // reservada es una hora ocupada.
  const deEsteTipo = citas.filter((c) => tipoDe(c) === tipo);

  return (
    <section className="mt-8 rounded-3xl border border-[#D8DCD4] bg-white p-5">
      <h2 className="text-[20px] font-extrabold tracking-tight">{TEXTOS[tipo].titulo}</h2>
      <p className="mt-1 text-[14px] text-[#46554D]">
        {TEXTOS[tipo].ayuda}
      </p>
      <div className="mt-4">
        <InvitarCita
          campana={campana}
          tipo={tipo}
          ocupados={citas.map((c) => idDesdeInicio(c.inicio)).filter((x): x is string => Boolean(x))}
        />
      </div>
      {fallo && <p className="mt-4 text-[14px] text-[#B42318]">No pudimos leer las citas.</p>}
      {deEsteTipo.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-[#E6E8E3] border-t border-[#E6E8E3]">
          {deEsteTipo.map((c) => {
            const h = horarioDeCita(c);
            return (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-[14px]">
                <span>
                  <strong>{c.nombre}</strong> <span className="text-[#46554D]">· {c.correo} · {horariosDeCita(c).length} horarios ofrecidos</span>
                </span>
                <span className="flex items-baseline gap-2">
                  <span className={h ? "font-semibold text-[var(--verde)]" : "text-[#46554D]"}>
                    {h ? `${describir(h)} · ${horaEnFrankfurt(h)}` : "Sin elegir hora"}
                    {!h && <span className="block text-[12.5px]">{estadoRecordatorio(c)}</span>}
                  </span>
                  {!h && <RecordarCita campana={campana} id={c.id} />}
                  <BorrarCita campana={campana} id={c.id} nombre={c.nombre} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
