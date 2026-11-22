"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";

/**
 * Aprobar tal cual, aprobar con el payload corregido (p. ej. el texto del
 * mensaje) o rechazar diciendo por qué: el agente lee ese motivo.
 */
export function DecidirAprobacion({ id, payload }: { id: number; payload: Record<string, unknown> }) {
  const original = JSON.stringify(payload, null, 2);
  const [texto, setTexto] = useState(original);
  const [motivo, setMotivo] = useState("");
  const { enviando, error, setError, correr } = useAccion();

  async function decidir(decision: "aprobar" | "rechazar") {
    const cuerpo: Record<string, unknown> = { decision };
    if (motivo.trim()) cuerpo.motivo = motivo.trim();
    if (decision === "rechazar" && !motivo.trim()) return setError("Escribe el motivo del rechazo: el agente lo lee.");
    if (decision === "aprobar" && texto !== original) {
      try {
        const p = JSON.parse(texto);
        if (!p || typeof p !== "object" || Array.isArray(p)) throw new Error();
        cuerpo.payload = p;
      } catch {
        return setError("El contenido editado no es JSON válido (un objeto { … }).");
      }
    }
    await correr(() => llamar("POST", `/aprobaciones/${id}/decision`, cuerpo, { clave: crypto.randomUUID() }));
  }

  return (
    <div className="flex flex-col gap-4">
      <details>
        <summary className="cursor-pointer select-none text-[14px] font-semibold text-[var(--verde)]">Ver o corregir los datos exactos{texto !== original ? " · editado" : ""}</summary>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={Math.min(16, original.split("\n").length + 1)} spellCheck={false}
          className="campo mono mt-3 w-full text-[13px] leading-relaxed !normal-case !tracking-normal" aria-label="Datos de la acción en JSON" />
      </details>
      <Campo etiqueta="Motivo" ayuda="Obligatorio al rechazar.">
        <input value={motivo} maxLength={2000} onChange={(e) => setMotivo(e.target.value)} className="campo" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={enviando} onClick={() => decidir("aprobar")} className="boton-principal">{enviando ? "Guardando…" : texto !== original ? "Aprobar con cambios" : "Aprobar"}</button>
        <button type="button" disabled={enviando} onClick={() => decidir("rechazar")} className="boton-secundario">Rechazar</button>
        {error && <p role="alert" className="text-[14px] text-[#B42318]">{error}</p>}
      </div>
    </div>
  );
}
