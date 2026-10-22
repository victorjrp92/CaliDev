"use client";

import { useState } from "react";
import { InvitarCita } from "./invitar-cita";
import { AgendarNueva } from "./agendar-nueva";

/**
 * Arriba del panel: citas para alguien que todavía no está en la lista (llegó
 * por Instagram, la página o WhatsApp). Dos caminos: proponerle horarios para
 * que elija, o agendar directo una hora ya acordada. Los dos envían el correo
 * desde info@calidev.dev.
 */
type Modo = "proponer" | "agendar" | null;

export function NuevaCita({ ocupados }: { ocupados: string[] }) {
  const [modo, setModo] = useState<Modo>(null);
  const boton = (m: Exclude<Modo, null>, texto: string) => (
    <button
      type="button"
      aria-pressed={modo === m}
      onClick={() => setModo(modo === m ? null : m)}
      className={`h-11 cursor-pointer rounded-xl px-4 text-[14.5px] font-bold ${
        modo === m ? "bg-[var(--verde)] text-[var(--hueso)]" : "border-[1.5px] border-[var(--verde)] bg-white text-[var(--verde)]"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <section className="rounded-3xl border border-[#D8DCD4] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight">Nueva cita</h2>
          <p className="text-[13.5px] text-[#46554D]">Para alguien que todavía no está en la lista.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {boton("proponer", "Proponer horarios")}
          {boton("agendar", "Ya acordamos la hora")}
        </div>
      </div>
      {modo === "proponer" && (
        <div className="mt-4 border-t border-[#E6E8E3] pt-4">
          <p className="mb-3 text-[13.5px] text-[#46554D]">Marca las fechas y horas tentativas: le llega un correo con cada una como botón y elige la que le sirva.</p>
          <InvitarCita tipo="primera" ocupados={ocupados} elegirTipo />
        </div>
      )}
      {modo === "agendar" && (
        <div className="mt-4 border-t border-[#E6E8E3] pt-4">
          <AgendarNueva ocupados={ocupados} />
        </div>
      )}
    </section>
  );
}
