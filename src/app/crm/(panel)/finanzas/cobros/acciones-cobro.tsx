"use client";

import { useState } from "react";
import { paraInputFecha } from "@/lib/crm/formato";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { METODOS, NOMBRE_METODO } from "../constantes";

/** Registrar el pago de un cobro pendiente (con su método) o anularlo diciendo por qué. */
export function AccionesCobro({ id, metodo, moneda }: { id: number; metodo: string; moneda: string }) {
  const [modo, setModo] = useState<"pagar" | "anular" | null>(null);
  const [m, setM] = useState(metodo === "stripe" ? "transferencia" : metodo);
  const [dia, setDia] = useState("");
  const [motivo, setMotivo] = useState("");
  const { enviando, error, setError, correr } = useAccion();
  const abrir = (x: "pagar" | "anular") => { setError(null); setModo(modo === x ? null : x); };

  async function pagar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = await correr(() => llamar("PATCH", `/cobros/${id}`, { accion: "pagado", metodo: m, ...(dia ? { pagado_at: dia } : {}) }, { clave: crypto.randomUUID() }));
    if (r) setModo(null);
  }

  async function anular(ev: React.FormEvent) {
    ev.preventDefault();
    if (!motivo.trim()) return setError("Di por qué se anula el cobro.");
    const r = await correr(() => llamar("PATCH", `/cobros/${id}`, { accion: "anulado", motivo: motivo.trim() }, { clave: crypto.randomUUID() }));
    if (r) setModo(null);
  }

  return (
    <div className="flex min-w-[230px] flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" className="boton-chico" data-tono="si" aria-expanded={modo === "pagar"} onClick={() => abrir("pagar")}>Registrar pago</button>
        <button type="button" className="boton-chico" data-tono="no" aria-expanded={modo === "anular"} onClick={() => abrir("anular")}>Anular</button>
      </div>
      {modo === "pagar" && (
        <form onSubmit={pagar} className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-[12.5px] text-[var(--texto-2)]">Método
            <select value={m} onChange={(e) => setM(e.target.value)} className="campo !min-h-9 !py-1 !text-[14px]">
              {METODOS.map((x) => <option key={x} value={x} disabled={x === "stripe" && moneda === "COP"}>{NOMBRE_METODO[x]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12.5px] text-[var(--texto-2)]">Fecha del pago (vacía = hoy)
            <input type="date" value={dia} max={paraInputFecha(new Date())} onChange={(e) => setDia(e.target.value)} className="campo !min-h-9 !py-1 !text-[14px]" />
          </label>
          <button type="submit" disabled={enviando} className="boton-chico w-fit" data-tono="si">{enviando ? "Guardando…" : "Confirmar pago"}</button>
        </form>
      )}
      {modo === "anular" && (
        <form onSubmit={anular} className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-[12.5px] text-[var(--texto-2)]">Motivo
            <input value={motivo} maxLength={500} onChange={(e) => setMotivo(e.target.value)} className="campo !min-h-9 !py-1 !text-[14px]" />
          </label>
          <button type="submit" disabled={enviando} className="boton-chico w-fit" data-tono="no">{enviando ? "Anulando…" : "Confirmar anulación"}</button>
        </form>
      )}
      {error && <p role="alert" className="text-[12.5px] text-[var(--peligro)]">{error}</p>}
    </div>
  );
}
