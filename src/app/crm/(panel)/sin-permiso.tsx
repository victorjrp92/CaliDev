/** Una sección que el rol no puede ver: se dice, no se esconde. */
export function SinPermiso({ que }: { que: string }) {
  return <p className="panel px-[18px] py-5 text-[14px] text-[var(--texto-2)]">Tu usuario no tiene permiso para ver {que}. Si lo necesitas, pídeselo a Victor.</p>;
}
