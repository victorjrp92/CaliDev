import { NextResponse, after } from "next/server";
import { arranquePorToken, marcarEnviado, respuestasDe } from "@/lib/arranque/datos";
import { SECCIONES } from "@/lib/arranque/esquema";
import { avance } from "@/lib/arranque/validar";
import { CORREO_VICTOR, enviarCorreo, envolver, escapar } from "@/lib/delegar/correos/enviar";

/**
 * «Enviar a CaliDev»: solo con todas las secciones completas. Desde ahí el
 * formulario queda cerrado y a Víctor le llega el aviso con el enlace al
 * panel, donde están las respuestas.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const a = await arranquePorToken(typeof body.token === "string" ? body.token : "");
  if (!a) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
  const { completas } = avance(respuestasDe(a));
  const faltan = SECCIONES.filter((s) => !completas.includes(s.id)).map((s) => s.titulo);
  if (faltan.length) return NextResponse.json({ error: `Falta completar: ${faltan.join(", ")}.` }, { status: 400 });

  await marcarEnviado(a.id);
  after(async () => {
    const panel = `https://calidev.dev/servinomic/arranques/${a.id}`;
    await enviarCorreo({
      para: CORREO_VICTOR,
      asunto: `Arranque listo: ${a.negocio || a.cliente}`,
      texto: `${a.cliente} completó y envió el formulario de arranque de ServiNomic.\n\nRespuestas: ${panel}`,
      html: envolver(`<p><b>${escapar(a.cliente)}</b> completó y envió el formulario de arranque de ServiNomic${a.negocio ? ` para <b>${escapar(a.negocio)}</b>` : ""}.</p><p><a href="${panel}" style="color:#0A3D2E;font-weight:700">Ver las respuestas</a></p>`),
    });
  });
  return NextResponse.json({ ok: true });
}
