"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TIPOS_LISTA, TipoJev, nombreTipo } from "../../ui/tipo";

/**
 * Un comentario con lo que hizo el agente. Si Jev se equivocó, Victor lo
 * corrige aquí: esas correcciones son el material para entrenar a Laya.
 */
export interface ComentarioVista {
  id: string; usuario: string | null; texto: string; tipo: string | null; tipoCorregido: string | null;
  confianza: number | null; respuesta: string | null; estado: string; meGusta: number | null; ts: string;
  /** Ya formateada en el servidor: formatear en el cliente rompe la hidratación. */
  cuando: string;
}

const ESTADO: Record<string, string> = {
  respondido: "Respondido", simulado: "Simulado", revision: "Por revisar", alerta: "Alerta", error: "Error",
  descartado: "Descartado", reservado: "En curso", sin_procesar: "Sin procesar (no automatizada)",
};

export function Comentario({ c }: { c: ComentarioVista }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  async function corregir(tipo: string) {
    if (!tipo) return;
    setGuardando(true);
    await fetch(`/api/social/comentarios/${c.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "corregir", tipo }),
    });
    setGuardando(false);
    router.refresh();
  }
  return (
    <li className="rounded-xl border border-[#E3E6E0] bg-white px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b>@{c.usuario}</b>
        <TipoJev tipo={c.tipo} confianza={c.confianza} />
        <span className="rounded-md bg-[#EEF0EB] px-2 py-0.5 text-xs">{ESTADO[c.estado] ?? c.estado}</span>
        {c.meGusta ? <span className="text-xs text-[#55635C]">{c.meGusta} me gusta</span> : null}
        <span className="ml-auto text-xs text-[#55635C]">{c.cuando}</span>
      </div>
      <p className="mt-1.5">«{c.texto}»</p>
      {c.respuesta && <p className="mt-1.5 border-l-[3px] border-[var(--lima)] pl-2.5 text-[#55635C]">{c.respuesta}</p>}
      {c.estado !== "sin_procesar" && <label className="mt-2 flex items-center gap-2 text-xs text-[#55635C]">
        ¿Tipo equivocado?
        <select
          disabled={guardando}
          defaultValue=""
          onChange={(e) => corregir(e.target.value)}
          className="rounded-md border border-[#D5DAD2] bg-white px-1.5 py-1 text-xs text-[var(--tinta)]"
        >
          <option value="">{c.tipoCorregido ? `Corregido: ${nombreTipo(c.tipoCorregido)}` : "—"}</option>
          {TIPOS_LISTA.map((t) => <option key={t} value={t}>{nombreTipo(t)}</option>)}
        </select>
      </label>}
    </li>
  );
}
