"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Escribir y enviar a Instagram desde el panel. Con borrador de la IA y tarjeta de la landing. */
export function Editor({ igsid, ventanaAbierta, puedeTarjeta }: { igsid: string; ventanaAbierta: boolean; puedeTarjeta: boolean }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [tarjeta, setTarjeta] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function llamar(cuerpo: object) {
    setOcupado(true);
    setEstado(null);
    const r = await fetch(`/api/social/chats/${igsid}/enviar`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo),
    });
    const d = await r.json().catch(() => ({}));
    setOcupado(false);
    return { ok: r.ok, d };
  }

  if (!ventanaAbierta) {
    return <p className="border-t border-[#E3E6E0] bg-[#FFF6E6] p-4 text-sm text-[#8A4B0B]">La ventana de 24 h está cerrada. Instagram no deja escribirle hasta que ella escriba de nuevo.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5 border-t border-[#E3E6E0] bg-white p-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <button disabled={ocupado} onClick={async () => { setEstado("Redactando…"); const { ok, d } = await llamar({ borrador: true }); if (ok) setTexto(d.borrador); setEstado(ok ? null : d.error); }}
          className="cursor-pointer rounded-full border border-[var(--verde)] bg-[#F1F8E0] px-3 py-1.5 font-semibold text-[var(--verde)]">Borrador con IA</button>
        {puedeTarjeta && (
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#D5DAD2] px-3 py-1.5">
            <input type="checkbox" checked={tarjeta} onChange={(e) => setTarjeta(e.target.checked)} /> Añadir tarjeta de la landing
          </label>
        )}
      </div>
      <label htmlFor="msg" className="sr-only">Mensaje</label>
      <textarea id="msg" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} placeholder="Escribe tu respuesta…"
        className="min-h-[80px] w-full rounded-xl border border-[#D5DAD2] px-3 py-2.5 text-[15px]" />
      <div className="flex items-center gap-3">
        {estado && <span role="status" className="text-sm text-[#8F2E1B]">{estado}</span>}
        <button disabled={ocupado || (!texto.trim() && !tarjeta)}
          onClick={async () => { const { ok, d } = await llamar({ texto, tarjeta }); if (ok) { setTexto(""); setTarjeta(false); router.refresh(); } else setEstado(d.error); }}
          className="ml-auto min-h-11 cursor-pointer rounded-xl bg-[var(--verde)] px-5 text-sm font-semibold text-white disabled:opacity-50">
          {ocupado ? "Enviando…" : "Enviar a Instagram"}
        </button>
      </div>
    </div>
  );
}
