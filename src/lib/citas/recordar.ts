import { citaPorId, horasOcupadas, marcarRecordatorio, registrarEvento, type Cita } from "@/lib/citas/datos";
import { correoInvitacion } from "@/lib/citas/correo-invitacion";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Enviar el recordatorio a una invitación sin hora elegida.
 *
 * Lo usan la tarea programada (a diario, a las 9 a. m. de Colombia) y el
 * botón del panel. Solo ofrece horas que siguen libres; si ya no queda
 * ninguna, no envía y lo dice, para que Víctor la invite con horarios nuevos.
 * Se marca como enviado solo si Resend aceptó el correo.
 */
export type ResultadoRecordatorio = "enviado" | "sin-horarios" | "fallo" | "ya-agendo";

export async function enviarRecordatorio(
  cita: Cita,
  origen: "automático" | "manual" = "automático",
  mensaje?: string | null
): Promise<ResultadoRecordatorio> {
  if (cita.inicio) return "ya-agendo";
  const ocupadas = new Set(await horasOcupadas(cita.id));
  const correo = correoInvitacion(cita, { recordatorio: true, ocupadas, mensajeRecordatorio: mensaje });
  if (correo.horariosLibres === 0) return "sin-horarios";
  if (!(await enviarCorreo(correo))) {
    await registrarEvento(cita.id, "fallo", `Recordatorio ${origen}: el correo no salió`);
    return "fallo";
  }
  await marcarRecordatorio(cita.id);
  await registrarEvento(cita.id, "recordatorio", `Recordatorio ${origen} para elegir hora${mensaje ? ` · «${mensaje.slice(0, 120)}»` : ""}`);
  return "enviado";
}

export async function enviarRecordatorioPorId(id: number, mensaje?: string | null): Promise<ResultadoRecordatorio | null> {
  const cita = await citaPorId(id);
  return cita ? enviarRecordatorio(cita, "manual", mensaje) : null;
}
