import { NextResponse, after } from "next/server";
import { arranquePorToken, marcarEnviado, respuestasDe } from "@/lib/arranque/datos";
import { plantillaDe } from "@/lib/arranque/plantillas";
import { avance } from "@/lib/arranque/validar";
import { CORREO_VICTOR, enviarCorreo, envolver, escapar } from "@/lib/delegar/correos/enviar";

/**
 * «Enviar a CaliDev»: con todas las secciones completas, o con las que haya si
 * la plantilla lo permite (`envioLibre`). Desde ahí el formulario queda
 * cerrado y a Víctor le llega el aviso con el enlace al panel y lo que faltó.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const a = await arranquePorToken(typeof body.token === "string" ? body.token : "");
  if (!a) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
  const { secciones, producto, envioLibre } = plantillaDe(a.plantilla);
  const { completas } = avance(respuestasDe(a), secciones);
  const faltan = secciones.filter((s) => !completas.includes(s.id)).map((s) => s.titulo);
  if (faltan.length && !envioLibre) return NextResponse.json({ error: `Falta completar: ${faltan.join(", ")}.` }, { status: 400 });

  await marcarEnviado(a.id);
  const falto = faltan.length ? ` Quedó sin completar: ${faltan.join(", ")}.` : "";
  after(async () => {
    const panel = `https://calidev.dev/servinomic/arranques/${a.id}`;
    await enviarCorreo({
      para: CORREO_VICTOR,
      asunto: `Arranque listo: ${a.negocio || a.cliente}`,
      texto: `${a.cliente} envió el formulario de arranque de ${producto}.${falto}\n\nRespuestas: ${panel}`,
      html: envolver(`<p><b>${escapar(a.cliente)}</b> envió el formulario de arranque de ${producto}${a.negocio ? ` para <b>${escapar(a.negocio)}</b>` : ""}.${escapar(falto)}</p><p><a href="${panel}" style="color:#0A3D2E;font-weight:700">Ver las respuestas</a></p>`),
    });
  });
  return NextResponse.json({ ok: true });
}
