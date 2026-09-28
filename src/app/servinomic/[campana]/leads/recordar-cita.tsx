"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Botón del panel para enviar el recordatorio ya, sin esperar las 24 horas. */
export function RecordarCita({ campana, id }: { campana: string; id: number }) {
  const router = useRouter();
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function recordar() {
    setEnviando(true);
    const res = await fetch(`/servinomic/${campana}/leads/recordar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    setEstado(json.mensaje ?? json.error ?? "Sin conexión.");
    if (res?.ok) router.refresh();
  }

  return (
    <span className="flex items-baseline gap-2">
      <button
        type="button"
        onClick={recordar}
        disabled={enviando}
        className="h-8 cursor-pointer rounded-lg px-2.5 text-[12.5px] font-semibold text-[var(--verde)] hover:bg-[#E6E8E3] disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Recordar ahora"}
      </button>
      {estado && <span role="status" className="text-[12.5px] text-[#46554D]">{estado}</span>}
    </span>
  );
}
