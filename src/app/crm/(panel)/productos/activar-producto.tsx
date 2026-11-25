"use client";

import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

/** Desactiva un producto (deja de ofrecerse en el alta) o lo vuelve a activar. */
export function ActivarProducto({ id, activo }: { id: number; activo: boolean }) {
  const { enviando, error, correr } = useAccion();
  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" disabled={enviando} className="boton-chico" onClick={() => correr(() => llamar("PATCH", `/productos/${id}`, { activo: !activo }, { clave: crypto.randomUUID() }))}>
        {activo ? "Desactivar" : "Activar"}
      </button>
      {error && <span role="alert" className="text-[12.5px] text-[var(--peligro)]">{error}</span>}
    </span>
  );
}
