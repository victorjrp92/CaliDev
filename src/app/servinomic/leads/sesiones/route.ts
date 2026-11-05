import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { crearCita, registrarEvento } from "@/lib/citas/datos";
import { disponibleAun, horarioDesdeId } from "@/lib/citas/horarios";
import { correoSesiones } from "@/lib/citas/correo-sesiones";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Invitar a un cliente a elegir la hora de sus sesiones incluidas: una cita por
 * sesión y un solo correo. `semanas` trae los horarios de cada sesión, en orden.
 *
 * Bajo /servinomic por la cookie del panel. Valida todo antes de crear nada,
 * para no dejar citas a medias. Cada sesión está en el contrato con su propio
 * plazo, así que no aplica el límite de días adelante de las invitaciones.
 */
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_SESIONES = 6;

export async function POST(request: Request) {
  if (!(await panelAbierto())) {
    return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 120) : "";
    const correo = typeof body.correo === "string" ? body.correo.trim().toLowerCase().slice(0, 160) : "";
    const negocio = typeof body.negocio === "string" ? body.negocio.trim().slice(0, 120) : "";
    if (nombre.length < 2) return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
    if (negocio.length < 2) return NextResponse.json({ error: "Falta el negocio." }, { status: 400 });
    if (!CORREO_OK.test(correo)) return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });

    const semanas = (Array.isArray(body.semanas) ? body.semanas : []).map((s) =>
      [...new Set(Array.isArray(s) ? s.filter((x): x is string => typeof x === "string") : [])]
        .map((id) => horarioDesdeId(id))
        .filter((h) => h && disponibleAun(h))
        .map((h) => h!.id)
        .sort()
    );
    if (semanas.length === 0 || semanas.length > MAX_SESIONES || semanas.some((s) => s.length === 0)) {
      return NextResponse.json({ error: "Cada sesión necesita al menos un horario válido." }, { status: 400 });
    }

    const citas = [];
    for (const [i, horarios] of semanas.entries()) {
      citas.push(await crearCita(nombre, correo, horarios, { tipo: "sesion", mensaje: `Sesión ${i + 1} de ${semanas.length}` }));
    }
    const enviado = await enviarCorreo(correoSesiones(nombre, negocio, citas));
    for (const c of citas) {
      await registrarEvento(c.id, enviado ? "invitacion" : "fallo", enviado ? `${c.mensaje}: invitación enviada` : "La invitación no salió");
    }
    const enlaces = citas.map((c) => `/cita/${c.token}`);
    if (!enviado) {
      return NextResponse.json({ error: "Las citas se guardaron, pero el correo no salió. Revisa Resend.", enlaces }, { status: 502 });
    }
    return NextResponse.json({ ok: true, enlaces });
  } catch (err) {
    console.error("citas sesiones:", err);
    return NextResponse.json({ error: "No pudimos crear las sesiones." }, { status: 500 });
  }
}
