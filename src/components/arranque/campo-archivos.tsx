"use client";

import { useState } from "react";
import { leerArchivo } from "@/lib/arranque/archivos";
import { useSubir } from "@/components/arranque/contexto";

/**
 * Plantillas que el cliente sube tal cual (Word, PDF): una fila por archivo
 * con su nombre, para que vea qué nos llegó, y «Quitar» por si se equivocó.
 */
const ACEPTA = ".doc,.docx,.pdf,.odt,.rtf";
const TIPO_POR_EXTENSION: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
};

const nombreSeguro = (n: string) =>
  n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-").slice(-80) || "archivo";

export function CampoArchivos({ valor, onCambio }: { valor: string[]; onCambio: (v: string[]) => void }) {
  const subir = useSubir();
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const archivos = valor.map(leerArchivo).filter((a) => a !== null);

  async function elegir(lista: FileList) {
    setError(null);
    let actual = valor;
    for (const f of Array.from(lista)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const tipo = TIPO_POR_EXTENSION[ext];
      if (!tipo) {
        setError(`«${f.name}» no es Word ni PDF.`);
        continue;
      }
      if (f.size > 15 * 1024 * 1024) {
        setError(`«${f.name}» pesa más de 15 MB.`);
        continue;
      }
      setSubiendo(f.name);
      try {
        const url = await subir(`plantillas/${nombreSeguro(f.name)}`, f, tipo);
        actual = [...actual, JSON.stringify({ url, nombre: f.name.slice(0, 120) })];
        onCambio(actual);
      } catch {
        setError(`No pudimos subir «${f.name}». Revisa tu conexión e inténtalo otra vez.`);
      }
    }
    setSubiendo(null);
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {archivos.map((a, i) => (
        <div key={a.url} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-[1.5px] border-[#CFE7DA] bg-white px-3.5">
          <span className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--verde)] text-[13px] font-bold text-[var(--lima)]">✓</span>
            <span className="truncate text-[15px]">{a.nombre}</span>
          </span>
          <button type="button" onClick={() => onCambio(valor.filter((_, j) => j !== i))} className="flex-none cursor-pointer text-[13.5px] text-[#8C948D] underline underline-offset-2">
            Quitar
          </button>
        </div>
      ))}
      <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-[var(--verde)] bg-white px-4 text-[15px] font-bold text-[var(--verde)]">
        {subiendo ? `Subiendo ${subiendo}…` : archivos.length ? "+ Subir otro archivo" : "+ Subir archivos"}
        <input type="file" accept={ACEPTA} multiple className="sr-only" disabled={Boolean(subiendo)} onChange={(e) => {
            const el = e.currentTarget;
            if (el.files?.length) elegir(el.files).finally(() => (el.value = ""));
          }} />
      </label>
      {error && (
        <p role="status" className="text-[13.5px] font-semibold text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
