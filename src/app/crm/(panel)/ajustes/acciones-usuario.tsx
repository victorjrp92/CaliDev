"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { MostrarUnaVez } from "./mostrar-una-vez";

/** Reinvitar (nuevo enlace, el viejo deja de servir), cerrar sus sesiones abiertas, o desactivar/activar. */
export function AccionesUsuario({ id, activo, humano, yo }: { id: number; activo: boolean; humano: boolean; yo: boolean }) {
  const [enlace, setEnlace] = useState<string | null>(null);
  const { enviando, error, correr } = useAccion();
  const pedir = async (cuerpo: Record<string, boolean>) => {
    const r = await correr(() => llamar<{ invitacion: string | null }>("PATCH", `/usuarios/${id}`, cuerpo));
    if (r?.invitacion) setEnlace(r.invitacion);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {humano && activo && <button type="button" disabled={enviando} className="boton-chico" onClick={() => pedir({ reinvitar: true })}>Nuevo enlace</button>}
        {humano && activo && <button type="button" disabled={enviando} className="boton-chico" onClick={() => pedir({ cerrar_sesiones: true })}>Cerrar sesiones</button>}
        {!yo && (
          <button type="button" disabled={enviando} className="boton-chico" data-tono={activo ? "no" : undefined}
            onClick={() => (!activo || confirm("¿Desactivar? No podrá entrar y sus claves dejan de servir.")) && pedir({ activo: !activo })}>
            {activo ? "Desactivar" : "Activar"}
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-[13px] text-[#B42318]">{error}</p>}
      {enlace && <MostrarUnaVez titulo="Enlace nuevo" valor={enlace} aviso="Sirve una sola vez." />}
    </div>
  );
}
