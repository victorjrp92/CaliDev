import { NextResponse } from "next/server";
import { arranquePorToken, guardarRespuestas, respuestasDe } from "@/lib/arranque/datos";
import { SECCIONES } from "@/lib/arranque/esquema";
import { avance, limpiarSeccion } from "@/lib/arranque/validar";

/**
 * Guarda una sección del formulario de arranque. Se llama cada vez que la
 * persona avanza o deja de escribir un momento, así nunca pierde lo que llenó.
 * Guarda aunque falten datos; el avance lo calcula el servidor con el esquema.
 */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const a = await arranquePorToken(typeof body.token === "string" ? body.token : "");
  if (!a) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
  if (a.enviado_at) return NextResponse.json({ error: "Este formulario ya se envió. Si necesitas cambiar algo, escríbenos." }, { status: 409 });
  const s = SECCIONES.find((x) => x.id === body.seccion);
  if (!s) return NextResponse.json({ error: "Sección desconocida." }, { status: 400 });

  const respuestas = { ...respuestasDe(a), [s.id]: limpiarSeccion(s, body.valor) };
  await guardarRespuestas(a.id, respuestas);
  return NextResponse.json({ ok: true, ...avance(respuestas) });
}

/** `sendBeacon` (al cerrar la pestaña) solo sabe hacer POST: mismo guardado. */
export const POST = PUT;
