/** Etiqueta del estado del agente en una publicación. Texto además de color. */
export function ModoAgente({ modo, sensible }: { modo: string | null; sensible?: boolean }) {
  if (sensible) return <span className="rounded-md bg-[#FFF1D9] px-2 py-0.5 text-xs font-bold text-[#8A4B0B]">Tema sensible</span>;
  if (modo === "automatico") return <span className="rounded-md bg-[var(--lima)] px-2 py-0.5 text-xs font-bold text-[var(--verde)]">Automático</span>;
  if (modo === "borradores") return <span className="rounded-md bg-[var(--niebla)] px-2 py-0.5 text-xs font-semibold text-[#33413A]">Solo borradores</span>;
  return <span className="rounded-md bg-[#F4F5F1] px-2 py-0.5 text-xs font-semibold text-[#55635C]">Apagado</span>;
}
