/** Etiqueta + control. El control lo pone quien llama (input, select, textarea con clase `campo`). */
export function Campo({ etiqueta, ayuda, children, className = "" }: { etiqueta: string; ayuda?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="mono text-[#46554D]">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-[12.5px] text-[#5F6B64]">{ayuda}</span>}
    </label>
  );
}
