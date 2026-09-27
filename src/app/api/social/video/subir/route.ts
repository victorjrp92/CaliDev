import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";

/**
 * Autoriza la subida directa navegador → Vercel Blob del video original, para
 * los reels que Instagram no entrega por la API (los que tienen música con
 * derechos). Directo porque una función de Vercel no acepta cuerpos de más de
 * 4,5 MB. Solo con sesión del panel y solo videos.
 */
export async function POST(peticion: Request) {
  const body = (await peticion.json()) as HandleUploadBody;
  try {
    const r = await handleUpload({
      body,
      request: peticion,
      onBeforeGenerateToken: async () => {
        if (!(await panelAbierto())) throw new Error("No autorizado");
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
