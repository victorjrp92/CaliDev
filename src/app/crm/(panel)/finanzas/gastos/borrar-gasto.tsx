"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

/** Borra un gasto tras confirmar: sale del resultado y del margen del mes. */
export function BorrarGasto({ id }: { id: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const { enviando, error, correr } = useAccion();
  const borrar = () => correr(() => llamar("DELETE", `/gastos/${id}`, undefined, { clave: crypto.randomUUID() }));
  return (
    <div className="flex min-w-[130px] flex-col gap-1.5">
      {confirmando ? (
        <div className="flex gap-2">
          <button type="button" disabled={enviando} onClick={borrar} className="boton-chico" data-tono="no">{enviando ? "Borrando…" : "Sí, borrar"}</button>
          <button type="button" disabled={enviando} onClick={() => setConfirmando(false)} className="boton-chico">No</button>
        </div>
      ) : <button type="button" onClick={() => setConfirmando(true)} className="boton-chico" data-tono="no">Borrar</button>}
      {error && <p role="alert" className="text-[12.5px] text-[var(--peligro)]">{error}</p>}
    </div>
  );
}
