"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Agendar directamente una hora ya acordada (por WhatsApp o en la llamada):
 * día, hora en Colombia y un mensaje opcional que encabeza la confirmación.
 * Sirve también para mover una cita ya reservada.
 */
const HORAS = Array.from({ length: 15 }, (_, i) => 6 + i);
const etiquetaHora = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h < 12 ? "a. m." : "p. m."}`;
const FRANKFURT = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" });

export function AgendarCita({ id, textoBoton }: { id: number; textoBoton: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState(8);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const horario = dia ? `${dia}T${String(hora).padStart(2, "0")}` : "";
  const enFrankfurt = dia ? FRANKFURT.format(new Date(`${horario}:00:00-05:00`)) : null;

  async function agendar() {
    if (!horario) return setEstado("Elige el día.");
    setEnviando(true);
    const res = await fetch("/servinomic/leads/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, horario, mensaje }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    setEstado(json.mensaje ?? json.error ?? "Sin conexión.");
    if (res?.ok) {
      setAbierto(false);
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
          {textoBoton}
        </button>
        {estado && <span role="status" className="text-[12.5px] text-[#46554D]">{estado}</span>}
      </span>
    );
  }

  const campo = "h-10 rounded-lg border-[1.5px] border-[#D8DCD4] bg-white px-3 text-[15px] outline-none focus:border-[var(--verde)]";
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-[#D8DCD4] bg-white p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[13px] font-semibold">
          Día
          <input type="date" className={`${campo} mt-1 block`} value={dia} onChange={(e) => setDia(e.target.value)} />
        </label>
        <label className="text-[13px] font-semibold">
          Hora (Colombia)
          <select className={`${campo} mt-1 block`} value={hora} onChange={(e) => setHora(Number(e.target.value))}>
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {etiquetaHora(h)}
              </option>
            ))}
          </select>
        </label>
        {enFrankfurt && <span className="pb-2 text-[13px] text-[#46554D]">= {enFrankfurt} en Frankfurt</span>}
      </div>
      <label className="text-[13px] font-semibold">
        Mensaje <span className="font-normal text-[#46554D]">(opcional · va arriba de la confirmación)</span>
        <textarea
          className="mt-1 min-h-[70px] w-full rounded-lg border-[1.5px] border-[#D8DCD4] px-3 py-2 text-[15px] font-normal outline-none focus:border-[var(--verde)]"
          maxLength={800}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={agendar}
          disabled={enviando}
          className="h-9 cursor-pointer rounded-lg bg-[var(--lima)] px-4 text-[13px] font-bold text-[var(--tinta)] disabled:opacity-60"
        >
          {enviando ? "Agendando…" : "Agendar y enviar confirmación"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="h-9 cursor-pointer px-3 text-[13px] text-[#46554D]">
          Cancelar
        </button>
      </div>
      {estado && <span role="status" className="text-[12.5px] text-[#46554D]">{estado}</span>}
    </div>
  );
}
