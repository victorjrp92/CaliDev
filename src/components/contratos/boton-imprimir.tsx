"use client";

/** Abre el diálogo de impresión, donde se elige «Guardar como PDF». */
export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-imprimir cursor-pointer rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--verde)] hover:border-[var(--verde)]"
    >
      Descargar PDF
    </button>
  );
}
