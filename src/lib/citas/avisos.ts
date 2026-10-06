import { guardarAvisos, type Cita } from "@/lib/citas/datos";
import { horarioDeCita } from "@/lib/citas/horarios";
import { avisoParaElla, avisoParaVictor, type Antelacion } from "@/lib/citas/correo-avisos";
import { cancelarCorreo, programarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Recordatorios antes de la cita, programados en Resend.
 *
 * El plan gratuito de Vercel solo permite una tarea al día, que no alcanza para
 * avisar una hora antes. Resend sí guarda correos programados (hasta 30 días) y
 * los envía a su hora; aquí se programan al reservar y se guardan sus ids para
 * cancelarlos si la persona cambia de hora o Víctor borra la cita.
 *
 * Un aviso cuya hora ya pasó (una cita reservada para dentro de 10 horas no
 * tiene aviso de 24 horas) simplemente no se programa.
 */

const MARGEN_MS = 5 * 60 * 1000;
const ANTELACIONES: [Antelacion, number][] = [
  ["24h", 24 * 60 * 60 * 1000],
  ["1h", 60 * 60 * 1000],
];

export async function programarAvisos(cita: Cita): Promise<string[]> {
  const h = horarioDeCita(cita);
  if (!h) return [];
  const ids: string[] = [];
  for (const [antes, ms] of ANTELACIONES) {
    const cuando = new Date(h.inicio.getTime() - ms);
    if (cuando.getTime() - Date.now() < MARGEN_MS) continue;
    for (const correo of [avisoParaElla(cita, h, antes), avisoParaVictor(cita, h, antes)]) {
      const id = await programarCorreo(correo, cuando);
      if (id) ids.push(id);
    }
  }
  await guardarAvisos(cita.id, ids);
  return ids;
}

export async function cancelarAvisos(cita: Pick<Cita, "avisos">): Promise<void> {
  const ids = (cita.avisos ?? "").split(",").filter(Boolean);
  for (const id of ids) await cancelarCorreo(id);
}

/** Al cambiar de hora: fuera los avisos de la hora anterior, dentro los de la nueva. */
export async function reprogramarAvisos(anterior: Pick<Cita, "avisos">, nueva: Cita): Promise<void> {
  await cancelarAvisos(anterior);
  await programarAvisos(nueva);
}
