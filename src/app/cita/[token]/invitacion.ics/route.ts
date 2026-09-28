import { citaPorToken } from "@/lib/citas/datos";
import { horarioPorInicio } from "@/lib/citas/horarios";
import { ics } from "@/lib/citas/ics";

/**
 * La invitación de la cita como archivo .ics, para Apple Calendar y Outlook.
 * PUBLISH y no REQUEST: aquí la persona la importa ella misma, no responde a
 * una invitación.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cita = await citaPorToken(token);
  const horario = cita ? horarioPorInicio(cita.inicio) : undefined;
  if (!cita || !horario) return new Response("Sin cita reservada", { status: 404 });

  return new Response(ics(cita, horario, "PUBLISH"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="videollamada-calidev.ics"',
      "Cache-Control": "no-store",
    },
  });
}
