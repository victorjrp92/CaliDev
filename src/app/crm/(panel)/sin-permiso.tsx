/** Una sección que el rol no puede ver: se dice, no se esconde. */
export function SinPermiso({ que }: { que: string }) {
  return <p className="rounded-2xl bg-[var(--niebla)] px-4 py-5 text-[14.5px]">Tu usuario no tiene permiso para ver {que}. Si lo necesitas, pídeselo a Victor.</p>;
}
