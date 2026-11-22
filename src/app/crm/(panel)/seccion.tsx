/** Título de bloque con su cuenta y una acción opcional a la derecha. */
export function Seccion({ titulo, cuenta, accion, children, className = "" }: { titulo: string; cuenta?: number | null; accion?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-tight">
          {titulo}
          {cuenta !== undefined && cuenta !== null && <span className="cifra ml-2 font-normal text-[#5F6B64]">{cuenta}</span>}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}
