"use client";

import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

export function RevocarClave({ id, nombre }: { id: number; nombre: string }) {
  const { enviando, error, correr } = useAccion();
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={enviando} className="boton-chico" data-tono="no"
        onClick={() => confirm(`¿Revocar «${nombre}»? Lo que la use deja de funcionar ya.`) && correr(() => llamar("DELETE", `/claves/${id}`))}>Revocar</button>
      {error && <span role="alert" className="text-[13px] text-[#B42318]">{error}</span>}
    </span>
  );
}
