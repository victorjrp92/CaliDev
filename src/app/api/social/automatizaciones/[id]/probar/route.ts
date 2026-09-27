import { NextResponse } from "next/server";
import { clasificarComentario } from "@/lib/social/jev";
import { redactar } from "@/lib/social/redactor";
import { accionFinal, decidir } from "@/lib/social/reglas";
import { sinSesion } from "@/lib/social/sesion";
import { validarAutomatizacion } from "@/lib/social/validar";

export const dynamic = "force-dynamic";

/** Simula un comentario con la configuración que está en pantalla (aún sin guardar). No publica nada. */
export async function POST(peticion: Request) {
  const no = await sinSesion();
  if (no) return no;
  const b = await peticion.json().catch(() => ({}));
  const comentario = typeof b.comentario === "string" ? b.comentario.slice(0, 300) : "";
  const r = validarAutomatizacion(b.config ?? {});
  if (!comentario || !r.ok) return NextResponse.json({ error: r.ok ? "Escribe un comentario" : r.error }, { status: 400 });
  const a = r.valor;
  const { tipo, confianza } = await clasificarComentario(comentario, a.contexto);
  const accion = accionFinal(decidir(tipo, confianza, a), comentario, a);
  const objetivo = accion === "contacto" ? "agradecer su interés y decirle que le escribimos por mensaje directo" : "responder con amabilidad";
  const respuesta =
    accion === "ignorar" ? null
    : accion === "fijo_aliado" ? a.textos.pubAliado[0]
    : accion === "fijo_critica" ? a.textos.pubCritica[0]
    : await redactar(comentario, objetivo, a.contexto);
  return NextResponse.json({ tipo, confianza, accion, respuesta, mensaje: accion === "contacto" ? a.textos.pregunta : null });
}
