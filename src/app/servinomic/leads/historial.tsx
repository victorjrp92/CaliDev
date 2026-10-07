import type { Persona } from "@/lib/seguimiento/personas";

/**
 * Todo lo que se le ha enviado y lo que ha hecho ella, del más reciente al más
 * antiguo: invitaciones, recordatorios (automáticos y a mano), reservas,
 * cambios, confirmaciones, recordatorios programados y fallos. Así «¿le llegó
 * algo?» tiene respuesta.
 */
const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

const NOMBRE: Record<string, string> = {
  invitacion: "Invitación enviada",
  recordatorio: "Recordatorio enviado",
  reserva: "Eligió hora",
  cambio: "Cambió la hora",
  confirmacion: "Confirmación enviada",
  avisos: "Recordatorios programados",
  fallo: "Falló un envío",
};

export function Historial({ persona }: { persona: Persona }) {
  const filas = persona.eventos;
  // Antes del registro (8 oct) los recordatorios solo dejaban su fecha en la cita.
  const viejos = [persona.primera, persona.segunda]
    .filter((c) => c?.recordatorio_at && !filas.some((e) => e.cita_id === c.id && e.tipo === "recordatorio"))
    .map((c) => ({ fecha: c!.recordatorio_at!, texto: "Recordatorio automático enviado (antes del registro)" }));

  if (filas.length === 0 && viejos.length === 0) {
    return <p className="text-[13px] text-[#46554D]">Sin correos registrados todavía.</p>;
  }
  return (
    <details className="group">
      <summary className="cursor-pointer text-[13px] font-semibold text-[var(--verde)]">
        Historial ({filas.length + viejos.length})
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-[#E6E8E3] pl-3">
        {filas.map((e) => (
          <li key={e.id} className="text-[13px] leading-snug">
            <span className="tabular-nums text-[#46554D]">{FECHA.format(new Date(e.created_at))}</span> ·{" "}
            <strong className={e.tipo === "fallo" ? "text-[#B42318]" : "text-[#14201B]"}>{NOMBRE[e.tipo] ?? e.tipo}</strong>
            <span className="text-[#46554D]"> ({e.cita} cita){e.detalle ? ` · ${e.detalle}` : ""}</span>
          </li>
        ))}
        {viejos.map((v) => (
          <li key={v.fecha} className="text-[13px] leading-snug">
            <span className="tabular-nums text-[#46554D]">{FECHA.format(new Date(v.fecha))}</span> · {v.texto}
          </li>
        ))}
      </ul>
    </details>
  );
}
