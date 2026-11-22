"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";

type Pendiente = { id: number; etiqueta: string; correo: string | null };
type Respuesta = { estado: "enviado"; correo: string } | { estado: "pendiente"; aprobacion: { id: number } };

/**
 * Mandar o reenviar el enlace de firma. Con permiso de envío sale ya; si no
 * (un agente), queda en Aprobaciones con el correo exacto.
 */
export function EnviarEnlace({ contratoId, pendientes, directo, yaEnviado }: { contratoId: number; pendientes: Pendiente[]; directo: boolean; yaEnviado: boolean }) {
  const [firmante, setFirmante] = useState(String(pendientes[0]?.id ?? ""));
  const elegido = pendientes.find((p) => String(p.id) === firmante);
  const [correo, setCorreo] = useState(elegido?.correo ?? "");
  const [hecho, setHecho] = useState<string | null>(null);
  const { enviando, error, correr } = useAccion();

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    setHecho(null);
    const r = await correr(() => llamar<Respuesta>("POST", `/contratos/${contratoId}/enviar`, { firmante_id: Number(firmante), correo: correo.trim() || undefined }, { clave: crypto.randomUUID() }));
    if (r) setHecho(r.estado === "enviado" ? `Enviado a ${r.correo}.` : `Quedó en Aprobaciones (#${r.aprobacion.id}): sale cuando Victor o Karen lo aprueben.`);
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
      {pendientes.length > 1 && (
        <Campo etiqueta="Para">
          <select value={firmante} onChange={(e) => { setFirmante(e.target.value); setCorreo(pendientes.find((p) => String(p.id) === e.target.value)?.correo ?? ""); }} className="campo">
            {pendientes.map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
          </select>
        </Campo>
      )}
      <Campo etiqueta={`Correo de ${elegido?.etiqueta ?? "quien firma"}`} ayuda="Si lo dejas vacío, el del contacto." className={pendientes.length > 1 ? "" : "sm:col-span-2"}>
        <input type="email" value={correo} maxLength={200} onChange={(e) => setCorreo(e.target.value)} className="campo" placeholder="nombre@empresa.com" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando || !firmante} className="boton-principal">
          {enviando ? "Enviando…" : directo ? (yaEnviado ? "Reenviar enlace" : "Enviar enlace de firma") : "Pedir aprobación para enviar"}
        </button>
        {hecho && <p role="status" className="text-[14px] text-[var(--texto-2)]">{hecho}</p>}
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>
    </form>
  );
}
