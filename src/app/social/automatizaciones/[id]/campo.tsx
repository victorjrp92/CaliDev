"use client";

/** Un texto editable del flujo, con contador: Meta corta los botones en 20. */
export function Campo({ etiqueta, valor, onCambio, max, filas = 2 }: { etiqueta: string; valor: string; onCambio: (v: string) => void; max: number; filas?: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#55635C]">
      <span className="flex justify-between">{etiqueta}<span>{valor.length}/{max}</span></span>
      {filas > 1 ? (
        <textarea value={valor} maxLength={max} rows={filas} onChange={(e) => onCambio(e.target.value)} className="rounded-lg border border-[#D5DAD2] px-2.5 py-2 text-sm text-[var(--tinta)]" />
      ) : (
        <input value={valor} maxLength={max} onChange={(e) => onCambio(e.target.value)} className="rounded-lg border border-[#D5DAD2] px-2.5 py-2 text-sm text-[var(--tinta)]" />
      )}
    </label>
  );
}
