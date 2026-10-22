import { NextResponse } from "next/server";
import { guardarContacto } from "@/lib/contacto/datos";
import { CORREO_VICTOR, enviarCorreo, envolver, escapar } from "@/lib/delegar/correos/enviar";

/**
 * El formulario de contacto de calidev.dev. Guarda el mensaje y lo reenvía a
 * calidevdev@gmail.com con «responder a» la persona: pulsar Responder en
 * Gmail le contesta directo.
 *
 * `sitio` es un campo oculto: una persona no lo ve ni lo llena; un bot que
 * rellena todo, sí. Ese envío se da por bueno sin guardar ni avisar.
 */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (txt(body.sitio, 100)) return NextResponse.json({ ok: true });
  const nombre = txt(body.name, 120).replace(/\s+/g, " ");
  const correo = txt(body.email, 200).toLowerCase();
  const mensaje = txt(body.message, 3000);
  const pagina = txt(body.pagina, 200) || null;
  if (nombre.length < 2 || !CORREO.test(correo) || mensaje.length < 2) {
    return NextResponse.json({ error: "Revisa tu nombre, tu correo y el mensaje." }, { status: 400 });
  }

  try {
    const c = await guardarContacto({ nombre, correo, mensaje, pagina });
    const ok = await enviarCorreo({
      para: CORREO_VICTOR,
      responderA: correo,
      asunto: `Mensaje desde calidev.dev · ${nombre}`,
      texto: `${nombre} (${correo}) escribió desde ${pagina ?? "calidev.dev"}:\n\n${mensaje}\n\nResponde este correo para contestarle directo.`,
      html: envolver(
        `<p><b>${escapar(nombre)}</b> (<a href="mailto:${escapar(correo)}" style="color:#0A3D2E">${escapar(correo)}</a>) escribió desde ${escapar(pagina ?? "calidev.dev")}:</p>
         <blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #C8F045;background:#F4F6F2;white-space:pre-wrap">${escapar(mensaje)}</blockquote>
         <p style="color:#5A6B63;font-size:14px">Responde este correo para contestarle directo. Mensaje n.º ${c.id}.</p>`
      ),
    });
    if (!ok) console.error("contacto: guardado pero el aviso no salió", c.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contacto:", err);
    return NextResponse.json({ error: "No pudimos enviar tu mensaje. Intenta de nuevo." }, { status: 500 });
  }
}
