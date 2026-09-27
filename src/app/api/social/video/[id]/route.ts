import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { detectarCaidas, type Escena } from "@/lib/social/caidas";
import { herramienta } from "@/lib/social/composio";
import { evento } from "@/lib/social/db";
import { analizarVideo, leerCurva } from "@/lib/social/gemini";
import { sinSesion } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * - JSON {accion:"analizar"}: descarga el reel (URL fresca: las de Instagram
 *   caducan) y lo analiza con Gemini.
 * - multipart con "curva" (imagen): lee la gráfica de retención y calcula las
 *   caídas alineadas con las escenas ya analizadas.
 */
export async function POST(peticion: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  const { id } = await params;
  const tipo = peticion.headers.get("content-type") ?? "";

  try {
    if (tipo.includes("multipart/form-data")) {
      const form = await peticion.formData();
      const archivo = form.get("curva");
      if (!(archivo instanceof File) || !archivo.type.startsWith("image/") || archivo.size > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "Sube una imagen de hasta 6 MB" }, { status: 400 });
      }
      const { rows } = await sql`SELECT duracion_s, escenas FROM social_video WHERE media_id = ${id}`;
      const curva = await leerCurva(await archivo.arrayBuffer(), archivo.type, rows[0]?.duracion_s ?? null);
      if (curva.length < 5) return NextResponse.json({ error: "No reconocimos una gráfica de retención en esa imagen" }, { status: 422 });
      const caidas = detectarCaidas(curva, (rows[0]?.escenas ?? []) as Escena[]);
      await sql`INSERT INTO social_video (media_id, curva, caidas) VALUES (${id}, ${JSON.stringify(curva)}, ${JSON.stringify(caidas)})
        ON CONFLICT (media_id) DO UPDATE SET curva = EXCLUDED.curva, caidas = EXCLUDED.caidas`;
      return NextResponse.json({ puntos: curva.length, caidas: caidas.length });
    }

    const b = await peticion.json().catch(() => ({}));
    // Video subido por Victor (Blob) o, si Instagram lo entrega, el de la API.
    let url = "";
    let subido = false;
    if (typeof b.url === "string") {
      const u = new URL(b.url);
      if (u.protocol !== "https:" || !u.hostname.endsWith(".blob.vercel-storage.com")) {
        return NextResponse.json({ error: "URL de video no permitida" }, { status: 400 });
      }
      url = b.url;
      subido = true;
    } else {
      const m = await herramienta("INSTAGRAM_GET_IG_MEDIA", { ig_media_id: id, fields: "media_url,media_type" });
      if (m.media_type !== "VIDEO") return NextResponse.json({ error: "Esta publicación no es un video" }, { status: 400 });
      url = m.media_url ?? "";
      if (!url) {
        return NextResponse.json({ error: "sin_archivo", detalle: "Instagram no entrega este video (suele pasar con música con derechos). Sube el archivo original." }, { status: 409 });
      }
    }
    const a = await analizarVideo(url);
    if (subido) await del(url).catch(() => {}); // no guardamos el video
    await sql`
      INSERT INTO social_video (media_id, duracion_s, transcripcion, escenas, gancho, analizado_en)
      VALUES (${id}, ${a.duracion_s}, ${JSON.stringify(a.transcripcion)}, ${JSON.stringify(a.escenas)},
        ${JSON.stringify({ ...a.gancho, recomendacion: a.recomendacion })}, NOW())
      ON CONFLICT (media_id) DO UPDATE SET duracion_s = EXCLUDED.duracion_s, transcripcion = EXCLUDED.transcripcion,
        escenas = EXCLUDED.escenas, gancho = EXCLUDED.gancho, analizado_en = NOW()`;
    return NextResponse.json({ ok: true, escenas: a.escenas.length });
  } catch (e) {
    await evento(`Análisis de video falló: ${(e as Error).message}`, "error", id);
    return NextResponse.json({ error: (e as Error).message.slice(0, 200) }, { status: 502 });
  }
}
