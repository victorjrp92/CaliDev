"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Enviar el recordatorio para elegir hora, sin esperar al automático. Se puede
 * escribir un mensaje propio («la cita es mañana…»); vacío, sale el texto de
 * siempre. Cada envío queda en el historial de la ficha.
 */
export function RecordarCita({ id }: { id: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function recordar() {
    setEnviando(true);
    const res = await fetch("/servinomic/leads/recordar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mensaje }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    setEstado(json.mensaje ?? json.error ?? "Sin conexión.");
    if (res?.ok) {
      setAbierto(false);
      setMensaje("");
      router.refresh();
    }
  }

  if (!abierto) {
    return (
      <span className="flex flex-wrap items-baseline gap-2">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="h-9 cursor-pointer rounded-lg border border-[#D8DCD4] bg-white px-3 text-[13px] font-semibold text-[var(--verde)] hover:border-[var(--verde)]"
        >
          Enviar recordatorio
        </button>
        {estado && <span role="status" className="text-[12.5px] text-[#46554D]">{estado}</span>}
      </span>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-[#D8DCD4] bg-white p-3">
      <label className="text-[13px] font-semibold">
        Mensaje <span className="font-normal text-[#46554D]">(opcional · vacío = texto de siempre)</span>
        <textarea
          className="mt-1 min-h-[70px] w-full rounded-lg border-[1.5px] border-[#D8DCD4] px-3 py-2 text-[15px] outline-none focus:border-[var(--verde)]"
          maxLength={600}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Te recuerdo que nuestra cita es mañana…"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={recordar}
          disabled={enviando}
          className="h-9 cursor-pointer rounded-lg bg-[var(--lima)] px-4 text-[13px] font-bold text-[var(--tinta)] disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="h-9 cursor-pointer px-3 text-[13px] text-[#46554D]">
          Cancelar
        </button>
      </div>
      {estado && <span role="status" className="text-[12.5px] text-[#46554D]">{estado}</span>}
    </div>
  );
}
