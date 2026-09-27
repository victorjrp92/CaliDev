import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { evento } from "@/lib/social/db";
import { responderComentario } from "@/lib/social/instagram";
import { sinSesion } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Acciones de Victor sobre un comentario:
 * - aprobar: publica el texto (editado o el borrador) como respuesta.
 * - descartar: no se responde.
 * - corregir: guarda el tipo correcto (material para entrenar a Laya).
 * - reintentar: vuelve a publicar un comentario que quedó en error.
 */
export async function POST(peticion: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  const { id } = await params;
  const b = await peticion.json().catch(() => ({}));
  const { rows } = await sql`SELECT * FROM social_comentarios WHERE id = ${id}`;
  const c = rows[0];
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 });

  if (b.accion === "corregir") {
    await sql`UPDATE social_comentarios SET tipo_corregido = ${String(b.tipo)} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "descartar") {
    await sql`UPDATE social_comentarios SET estado = 'descartado' WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "aprobar" || b.accion === "reintentar") {
    const texto = String(b.texto ?? c.respuesta ?? "").trim().slice(0, 300);
    if (!texto) return NextResponse.json({ error: "La respuesta está vacía" }, { status: 400 });
    try {
      await responderComentario(id, texto);
    } catch (e) {
      await evento(`No se pudo publicar la respuesta a @${c.usuario}: ${(e as Error).message}`, "error", c.media_id);
      return NextResponse.json({ error: "Instagram rechazó la respuesta" }, { status: 502 });
    }
    await sql`UPDATE social_comentarios SET estado = 'respondido', respuesta = ${texto}, error = NULL WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
