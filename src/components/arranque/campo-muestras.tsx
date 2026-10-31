"use client";

import { useState } from "react";
import { leerMuestra } from "@/lib/arranque/archivos";
import { TIPOS_MUESTRA } from "@/lib/arranque/esquema-seirilegal";
import { useSubir } from "@/components/arranque/contexto";
import { CensurarDocumento } from "@/components/arranque/censurar-documento";

/**
 * Los documentos de ejemplo: se elige un archivo, se tapa y se sube. Arriba,
 * cuántos lleva frente al mínimo y qué tipos ya tiene, para animar a variar;
 * abajo, las miniaturas de lo que ya nos llegó.
 */
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CampoMuestras({ valor, minimo, onCambio }: { valor: string[]; minimo: number; onCambio: (v: string[]) => void }) {
  const subir = useSubir();
  const [archivo, setArchivo] = useState<File | null>(null);
  const muestras = valor.map(leerMuestra);
  const tipos = new Set(muestras.map((m) => m?.tipo));
  const n = valor.length;

  async function listo({ tipo, paginas }: { tipo: string; paginas: Blob[] }) {
    const base = `muestras/${slug(tipo)}-${n + 1}`;
    const urls: string[] = [];
    for (let i = 0; i < paginas.length; i++) urls.push(await subir(`${base}-p${i + 1}.jpg`, paginas[i], "image/jpeg"));
    onCambio([...valor, JSON.stringify({ tipo, paginas: urls })]);
    setArchivo(null);
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="rounded-xl bg-white p-3.5">
        <p className="mono text-[13.5px] text-[var(--verde)]">
          {n} de {minimo} {n >= minimo ? "· ¡mínimo cumplido! Si llegas a 20, mejor" : `· te faltan ${minimo - n}`}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E3E6E0]">
          <div className="h-full rounded-full bg-[var(--lima)] transition-[width] duration-500" style={{ width: `${Math.min(100, (n / minimo) * 100)}%` }} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tipos de documento">
          {TIPOS_MUESTRA.filter((t) => t.tipo !== "Otro").map((t) => (
            <li key={t.tipo} className={`rounded-full px-2.5 py-1 text-[12.5px] ${tipos.has(t.tipo) ? "bg-[var(--verde)] font-semibold text-[var(--lima)]" : "bg-[#EEF2EF] text-[#5A6B63]"}`}>
              {tipos.has(t.tipo) ? "✓ " : ""}
              {t.tipo}
            </li>
          ))}
        </ul>
      </div>

      {n > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {muestras.map((m, i) =>
            m ? (
              <li key={m.paginas[0]} className="flex flex-col overflow-hidden rounded-xl border border-[#D8DCD4] bg-white">
                <a href={m.paginas[0]} target="_blank" rel="noreferrer" className="block aspect-[3/4] bg-[#EEF2EF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.paginas[0]} alt={`${m.tipo}, ya tapado`} loading="lazy" className="h-full w-full object-cover object-top" />
                </a>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="truncate text-[12px] font-semibold">
                    {m.tipo}
                    {m.paginas.length > 1 && <span className="font-normal text-[#5A6B63]"> · {m.paginas.length} pág.</span>}
                  </span>
                  <button type="button" onClick={() => onCambio(valor.filter((_, j) => j !== i))} aria-label={`Quitar ${m.tipo}`} className="cursor-pointer text-[15px] leading-none text-[#8C948D]">
                    ×
                  </button>
                </div>
              </li>
            ) : null
          )}
        </ul>
      )}

      <label className="flex min-h-13 cursor-pointer items-center justify-center rounded-xl bg-[var(--verde)] px-4 text-[16px] font-bold text-white">
        + Subir un documento
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (f) setArchivo(f);
          }}
        />
      </label>
      <p className="text-[13px] leading-snug text-[#5A6B63]">Una foto o un PDF. Antes de subirlo lo tapas, y te mostramos cómo queda.</p>

      {archivo && <CensurarDocumento archivo={archivo} onListo={listo} onCancelar={() => setArchivo(null)} />}
    </div>
  );
}
