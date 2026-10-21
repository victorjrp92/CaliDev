"use client";

import { useState } from "react";
import type { Seccion, Valores } from "@/lib/arranque/esquema";
import { filasAElementos } from "@/lib/arranque/excel";

/**
 * Para listas largas: subir un Excel en vez de llenar tarjeta por tarjeta.
 * Dice qué títulos de columna reconoce y, al subir, cuántos agregó y qué
 * columnas ignoró. Lo que llega pasa por la misma validación de siempre.
 */
export function SubirExcel({ seccion: s, onAgregar }: { seccion: Seccion; onAgregar: (xs: Valores[]) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);

  async function leer(archivo: File) {
    setLeyendo(true);
    setMensaje(null);
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const filas = (await readSheet(archivo)) as unknown[][];
      const r = filasAElementos(filas, s.campos);
      if (!r.elementos.length) {
        setMensaje("No encontramos filas con datos. Revisa que la primera fila tenga los títulos de las columnas.");
      } else {
        onAgregar(r.elementos);
        setMensaje(
          `Agregamos ${r.elementos.length} ${r.elementos.length === 1 ? s.item?.singular : s.item?.plural}. Revisa abajo los que digan «Falta completar».` +
            (r.ignoradas.length ? ` Ignoramos estas columnas: ${r.ignoradas.join(", ")}.` : "")
        );
      }
    } catch {
      setMensaje("No pudimos leer ese archivo. Debe ser un Excel (.xlsx).");
    }
    setLeyendo(false);
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="cursor-pointer text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
        ¿Son muchos? Súbelos desde un Excel
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#B9C2BC] bg-white p-4">
      <p className="text-[14px] font-semibold">Sube un Excel (.xlsx) con una fila por {s.item?.singular}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#5A6B63]">
        La primera fila deben ser los títulos. Reconocemos: {s.campos.map((c) => c.etiqueta).join(" · ")}.
      </p>
      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-[var(--verde)] px-4 text-[14px] font-bold text-white">
        {leyendo ? "Leyendo…" : "Elegir archivo"}
        <input type="file" accept=".xlsx" className="sr-only" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
      </label>
      {mensaje && (
        <p role="status" className="mt-3 text-[14px] text-[var(--tinta)]">
          {mensaje}
        </p>
      )}
    </div>
  );
}
