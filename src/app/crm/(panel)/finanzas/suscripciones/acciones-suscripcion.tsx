"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

type Estado = "activa" | "pausada" | "cancelada";

/** Pausar, reactivar o cancelar una suscripción; cancelar pide confirmar porque deja de contar en el MRR. */
export function AccionesSuscripcion({ id, estado }: { id: number; estado: Estado }) {
  const [confirmando, setConfirmando] = useState(false);
  const { enviando, error, correr } = useAccion();
  const poner = async (nuevo: Estado) => {
    const r = await correr(() => llamar("PATCH", `/suscripciones/${id}`, { estado: nuevo }, { clave: crypto.randomUUID() }));
    if (r) setConfirmando(false);
  };
  return (
    <div className="flex min-w-[200px] flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {estado === "activa" && <button type="button" disabled={enviando} onClick={() => poner("pausada")} className="boton-chico">Pausar</button>}
        {estado !== "activa" && <button type="button" disabled={enviando} onClick={() => poner("activa")} className="boton-chico" data-tono="si">Reactivar</button>}
        {estado !== "cancelada" && !confirmando && <button type="button" disabled={enviando} onClick={() => setConfirmando(true)} className="boton-chico" data-tono="no">Cancelar</button>}
        {confirmando && (
          <>
            <button type="button" disabled={enviando} onClick={() => poner("cancelada")} className="boton-chico" data-tono="no">{enviando ? "Cancelando…" : "Sí, cancelar"}</button>
            <button type="button" disabled={enviando} onClick={() => setConfirmando(false)} className="boton-chico">No</button>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-[12.5px] text-[var(--peligro)]">{error}</p>}
    </div>
  );
}
