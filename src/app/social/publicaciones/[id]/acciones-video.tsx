"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Botones de la pestaña Video: analizar (con el video de Instagram o con el
 * archivo original si Instagram no lo entrega) y subir la captura de la curva
 * de retención.
 */
export function AccionesVideo({ mediaId, hayAnalisis }: { mediaId: string; hayAnalisis: boolean }) {
  const router = useRouter();
  const archivoVideo = useRef<HTMLInputElement>(null);
  const archivoCurva = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [pideArchivo, setPideArchivo] = useState(false);

  async function analizar(url?: string) {
    setEstado("Analizando el video con Gemini… (puede tardar un minuto)");
    const r = await fetch(`/api/social/video/${mediaId}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(url ? { url } : { accion: "analizar" }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 409 && d.error === "sin_archivo") {
      setPideArchivo(true);
      setEstado(d.detalle);
      return;
    }
    setEstado(r.ok ? null : `No se pudo analizar: ${d.error ?? r.status}`);
    if (r.ok) router.refresh();
  }

  async function subirVideo(f: File) {
    setEstado("Subiendo el video…");
    try {
      const blob = await upload(`social/${mediaId}-${f.name}`, f, { access: "public", handleUploadUrl: "/api/social/video/subir" });
      await analizar(blob.url);
    } catch (e) {
      setEstado(`No se pudo subir: ${(e as Error).message}`);
    }
  }

  async function subirCurva(f: File) {
    setEstado("Leyendo la curva…");
    const form = new FormData();
    form.append("curva", f);
    const r = await fetch(`/api/social/video/${mediaId}`, { method: "POST", body: form });
    const d = await r.json().catch(() => ({}));
    setEstado(r.ok ? null : d.error ?? "No se pudo leer la curva");
    if (r.ok) router.refresh();
  }

  const boton = "min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => analizar()} className={`${boton} bg-[var(--verde)] text-white`}>
          {hayAnalisis ? "Volver a analizar" : "Analizar video"}
        </button>
        {pideArchivo && (
          <button onClick={() => archivoVideo.current?.click()} className={`${boton} bg-[var(--lima)] text-[var(--verde)]`}>
            Subir el video original
          </button>
        )}
        <button onClick={() => archivoCurva.current?.click()} className={`${boton} border border-[#D5DAD2] bg-white`}>
          Subir captura de retención
        </button>
      </div>
      <input ref={archivoVideo} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => e.target.files?.[0] && subirVideo(e.target.files[0])} />
      <input ref={archivoCurva} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && subirCurva(e.target.files[0])} />
      {estado && <p role="status" className="text-sm text-[#33413A]">{estado}</p>}
    </div>
  );
}
