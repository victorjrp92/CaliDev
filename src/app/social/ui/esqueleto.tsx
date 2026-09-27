/** Esqueleto de carga: la página pinta al instante mientras llegan los datos. */
export function Esqueleto({ filas = 6 }: { filas?: number }) {
  return (
    <main className="mx-auto flex max-w-[1180px] animate-pulse flex-col gap-4 px-4 py-7 md:px-8" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 rounded-lg bg-[#E6E8E3]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-20 rounded-2xl bg-[#E6E8E3]" />)}
      </div>
      {Array.from({ length: filas }, (_, i) => <div key={i} className="h-16 rounded-2xl bg-[#EEF0EB]" />)}
    </main>
  );
}
