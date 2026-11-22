"use client";

import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

/** Tomar una tarea (queda a mi nombre) o marcarla hecha. */
export function AccionesTarea({ id, mia }: { id: number; mia: boolean }) {
  const { enviando, error, correr } = useAccion();
  const hacer = (accion: "tomar" | "hecha") => correr(() => llamar("PATCH", `/tareas/${id}`, { accion }));
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex gap-2">
        {!mia && <button type="button" disabled={enviando} onClick={() => hacer("tomar")} className="boton-chico">Tomar</button>}
        <button type="button" disabled={enviando} onClick={() => hacer("hecha")} className="boton-chico" data-tono="si">Hecha</button>
      </div>
      {error && <p role="alert" className="text-[12.5px] text-[var(--peligro)]">{error}</p>}
    </div>
  );
}
