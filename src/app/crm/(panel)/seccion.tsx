/** Un grupo con título y cuenta encima, y una acción opcional a la derecha (al estilo de las listas agrupadas de Apple). */
export function Seccion({ titulo, cuenta, accion, children, className = "" }: { titulo: string; cuenta?: number | null; accion?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-2.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="titulo-2">
          {titulo}
          {cuenta !== undefined && cuenta !== null && <span className="num ml-2 font-normal text-[var(--texto-2)]">{cuenta}</span>}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}
