"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";

type PersonaCorta = { id: number; nombre: string; empresa: string | null };

/**
 * Oportunidad nueva. Nace en Lead con próximo paso y fecha (sin eso no queda
 * abierta). El precio solo lo ve quien puede fijarlo.
 */
export function NuevaOportunidad({ personas, personaInicial, fechaInicial, precio, abierta = false }: {
  personas: PersonaCorta[]; personaInicial?: number | null; fechaInicial: string; precio: boolean; abierta?: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState({ titulo: "", persona_id: personaInicial ? String(personaInicial) : "", proximo_paso: "", proximo_paso_at: fechaInicial, valor_arranque: "", valor_mensual: "", moneda: "COP" });
  const [clave] = useState(() => crypto.randomUUID());
  const { enviando, error, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const cuerpo: Record<string, unknown> = { titulo: f.titulo, proximo_paso: f.proximo_paso, proximo_paso_at: f.proximo_paso_at };
    if (f.persona_id) cuerpo.persona_id = Number(f.persona_id);
    if (precio && f.valor_arranque) cuerpo.valor_arranque = f.valor_arranque;
    if (precio && f.valor_mensual) cuerpo.valor_mensual = f.valor_mensual;
    if (precio && (f.valor_arranque || f.valor_mensual)) cuerpo.moneda = f.moneda;
    const r = await correr(() => llamar<{ oportunidad: { id: number } }>("POST", "/oportunidades", cuerpo, { clave }), { refrescar: false });
    if (r) router.push(`/crm/ventas/${r.oportunidad.id}`);
  }

  return (
    <details open={abierta} className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Nueva oportunidad</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Título" className="sm:col-span-2">
          <input required maxLength={200} value={f.titulo} onChange={pon("titulo")} placeholder="ServiNomic para Limpia Express" className="campo" />
        </Campo>
        <Campo etiqueta="Persona" ayuda="¿No está? Créala en Contactos y vuelve.">
          <select value={f.persona_id} onChange={pon("persona_id")} className="campo">
            <option value="">— Sin persona —</option>
            {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.empresa ? ` · ${p.empresa}` : ""}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Fecha del próximo paso">
          <input type="date" required value={f.proximo_paso_at} onChange={pon("proximo_paso_at")} className="campo" />
        </Campo>
        <Campo etiqueta="Próximo paso" className="sm:col-span-2">
          <input required maxLength={300} value={f.proximo_paso} onChange={pon("proximo_paso")} placeholder="Llamarla para calificar" className="campo" />
        </Campo>
        {precio && (
          <>
            <Campo etiqueta="Arranque" ayuda="Sin puntos: 2500000">
              <input inputMode="numeric" value={f.valor_arranque} onChange={pon("valor_arranque")} className="campo" />
            </Campo>
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <Campo etiqueta="Mensualidad"><input inputMode="numeric" value={f.valor_mensual} onChange={pon("valor_mensual")} className="campo" /></Campo>
              <Campo etiqueta="Moneda">
                <select value={f.moneda} onChange={pon("moneda")} className="campo"><option>COP</option><option>EUR</option><option>USD</option></select>
              </Campo>
            </div>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear oportunidad"}</button>
          {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
        </div>
      </form>
    </details>
  );
}
