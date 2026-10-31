import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { arranquePorToken } from "@/lib/arranque/datos";
import { carpetaDe } from "@/lib/arranque/archivos";

export const dynamic = "force-dynamic";

/**
 * Autoriza la subida directa navegador → Vercel Blob desde un arranque: las
 * plantillas del cliente y sus documentos de ejemplo ya tapados. Solo con un
 * enlace válido que no se haya enviado, solo dentro de la carpeta de ese
 * enlace y solo imágenes, PDF y documentos de texto.
 */
const TIPOS = [
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
];

export async function POST(peticion: Request) {
  const body = (await peticion.json()) as HandleUploadBody;
  try {
    const r = await handleUpload({
      body,
      request: peticion,
      onBeforeGenerateToken: async (ruta, token) => {
        const a = await arranquePorToken(token ?? "");
        if (!a || a.enviado_at || !ruta.startsWith(carpetaDe(a.token))) throw new Error("Este enlace no permite subir archivos.");
        return { allowedContentTypes: TIPOS, maximumSizeInBytes: 15 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
