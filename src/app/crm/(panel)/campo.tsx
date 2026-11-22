/** Etiqueta + control. El control lo pone quien llama (input, select, textarea con clase `campo`). */
export function Campo({ etiqueta, ayuda, children, className = "" }: { etiqueta: string; ayuda?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-[var(--texto-2)]">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-[12.5px] text-[var(--texto-2)]">{ayuda}</span>}
    </label>
  );
}
