"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

const TIPOS = [
  { v: "nota", t: "Nota" },
  { v: "resumen_llamada", t: "Resumen de llamada" },
  { v: "brief", t: "Brief" },
];

export function AgregarNota({ entidad, id }: { entidad: string; id: number }) {
  const [cuerpo, setCuerpo] = useState("");
  const [tipo, setTipo] = useState("nota");
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const { enviando, error, correr } = useAccion();

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = await correr(() => llamar("POST", "/notas", { entidad, entidad_id: id, tipo, cuerpo }, { clave }));
    if (r) {
      setCuerpo("");
      setClave(crypto.randomUUID());
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-2">
      <textarea aria-label="Nota nueva" required value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} placeholder="Qué pasó, qué dijo, qué sigue…" className="campo" />
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Tipo de nota" value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo !w-auto !min-h-9 !py-1 text-[14px]">
          {TIPOS.map((x) => <option key={x.v} value={x.v}>{x.t}</option>)}
        </select>
        <button type="submit" disabled={enviando || !cuerpo.trim()} className="boton-chico" data-tono="si">{enviando ? "Guardando…" : "Guardar nota"}</button>
        {error && <p role="alert" className="text-[13px] text-[var(--peligro)]">{error}</p>}
      </div>
    </form>
  );
}
