"use client";

import { useState } from "react";
import { nombreTipo } from "../../ui/tipo";

/** Prueba la configuración en pantalla con un comentario inventado. No publica nada. */
export function Simulador({ config }: { config: object }) {
  const [comentario, setComentario] = useState("Tengo una panadería y todo lo llevo en un cuaderno, ¿esto me sirve?");
  const [r, setR] = useState<{ tipo: string; confianza: number; accion: string; respuesta: string | null; mensaje: string | null } | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  async function simular() {
    setEstado("Simulando…");
    const res = await fetch(`/api/social/automatizaciones/x/probar`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comentario, config }),
    });
    const d = await res.json().catch(() => ({}));
    setEstado(res.ok ? null : d.error);
    if (res.ok) setR(d);
  }
  const ACCION: Record<string, string> = {
    ia: "Responde con IA", contacto: "Responde con IA + mensaje privado", fijo_aliado: "Texto fijo del aliado",
    fijo_critica: "«Gracias por tu comentario» + aviso", ignorar: "No responde + aviso", revision: "Te lo deja a ti",
  };
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E3E6E0] bg-white p-5">
      <h2 className="text-lg font-bold">Probar antes de activar</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="sim" className="sr-only">Comentario de prueba</label>
        <input id="sim" value={comentario} onChange={(e) => setComentario(e.target.value)} className="flex-1 rounded-xl border border-[#D5DAD2] px-3 py-2.5 text-sm" />
        <button onClick={simular} className="min-h-11 cursor-pointer rounded-xl bg-[var(--tinta)] px-5 text-sm font-semibold text-white">Simular</button>
      </div>
      {estado && <p role="status" className="text-sm text-[#55635C]">{estado}</p>}
      {r && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#FAFAF7] p-3.5 text-sm">
          <p><b>Jev:</b> {nombreTipo(r.tipo)} · {Math.round(r.confianza * 100)} %</p>
          <p><b>Acción:</b> {ACCION[r.accion] ?? r.accion}</p>
          {r.respuesta && <p><b>Respuesta pública:</b> «{r.respuesta}»</p>}
          {r.mensaje && <p><b>Mensaje privado:</b> «{r.mensaje}» + 3 botones</p>}
          <p className="text-xs text-[#55635C]">No se publicó nada: es una simulación.</p>
        </div>
      )}
    </section>
  );
}
