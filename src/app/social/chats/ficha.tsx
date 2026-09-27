"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ficha de la persona: de dónde vino, qué hizo en la landing, nota interna y pausa del agente. */
export interface Ficha {
  igsid: string; usuario: string | null; paso: string; rama: string | null; publicacion: string | null;
  comentario: string | null; etiquetas: string[]; nota: string | null; visitas: number; scroll: number | null;
  pasoFormulario: number; dejoDatos: boolean;
}
const PASO_FORM = ["No lo empezó", "Empezó el paso 1", "Pasó a sus datos", "Dejó sus datos", "Completó todo"];

export function FichaPersona({ f }: { f: Ficha }) {
  const router = useRouter();
  const [nota, setNota] = useState(f.nota ?? "");
  const [guardado, setGuardado] = useState(true);
  async function guardar(cuerpo: object) {
    await fetch(`/api/social/chats/${f.igsid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    router.refresh();
  }
  const pausado = f.paso === "revision";
  return (
    <div className="flex flex-col gap-4 p-5 text-sm">
      <div>
        <b className="text-base">@{f.usuario}</b>
        <a href={`https://instagram.com/${f.usuario}`} target="_blank" rel="noreferrer" className="ml-2 text-xs">Abrir en Instagram ↗</a>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <dt className="text-[#55635C]">Vino de</dt><dd>{f.publicacion ?? "—"}</dd>
        <dt className="text-[#55635C]">Comentó</dt><dd>{f.comentario ? `«${f.comentario}»` : "—"}</dd>
        <dt className="text-[#55635C]">Rama</dt><dd>{f.rama ?? "—"}</dd>
        <dt className="text-[#55635C]">Landing</dt><dd>{f.visitas ? `${f.visitas} visita(s) · bajó al ${f.scroll ?? 0} %` : "No la ha abierto"}</dd>
        <dt className="text-[#55635C]">Formulario</dt><dd>{PASO_FORM[f.pasoFormulario] ?? "—"}{f.dejoDatos ? " ✓" : ""}</dd>
      </dl>
      <div>
        <label htmlFor="nota" className="text-xs text-[#55635C]">Nota interna</label>
        <textarea id="nota" value={nota} onChange={(e) => { setNota(e.target.value); setGuardado(false); }}
          onBlur={() => { if (!guardado) { guardar({ nota }); setGuardado(true); } }}
          className="mt-1 min-h-[80px] w-full rounded-xl border border-[#D5DAD2] px-3 py-2" />
      </div>
      <button onClick={() => guardar({ pausado: !pausado })}
        className="min-h-11 cursor-pointer rounded-xl border border-[#D5DAD2] px-4 text-sm font-semibold">
        {pausado ? "Devolver al agente" : "Pausar el agente con esta persona"}
      </button>
    </div>
  );
}
