"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Trae lo nuevo de Instagram (bandeja entera o una conversación). Es la única llamada a Instagram desde Chats. */
export function Actualizar({ igsid, desde }: { igsid?: string; desde: string | null }) {
  const router = useRouter();
  const [estado, setEstado] = useState<string | null>(null);
  async function ir() {
    setEstado("Consultando Instagram…");
    const r = await fetch("/api/social/chats/sincronizar", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(igsid ? { igsid } : {}),
    });
    const d = await r.json().catch(() => ({}));
    setEstado(r.ok ? null : d.error ?? "No se pudo actualizar");
    if (r.ok) router.refresh();
  }
  return (
    <span className="flex items-center gap-2 text-xs text-[#55635C]">
      {estado ?? (desde ? `Actualizado ${desde}` : "")}
      <button onClick={ir} className="cursor-pointer rounded-lg border border-[#D5DAD2] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--tinta)]">
        ↻ Actualizar
      </button>
    </span>
  );
}
