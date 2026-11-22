"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";

type Valores = { titulo: string; valor_arranque: string; valor_mensual: string; moneda: string; responsable_id: string };

/** Título, responsable y —si quien edita puede fijar precio— los valores. Solo se manda lo que cambió. */
export function EditarOportunidad({ id, inicial, precio, usuarios }: { id: number; inicial: Valores; precio: boolean; usuarios: { id: number; nombre: string }[] }) {
  const [f, setF] = useState(inicial);
  const { enviando, error, correr } = useAccion();
  const pon = (k: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const c: Record<string, unknown> = {};
    if (f.titulo !== inicial.titulo) c.titulo = f.titulo;
    if (f.responsable_id !== inicial.responsable_id) c.responsable_id = f.responsable_id ? Number(f.responsable_id) : null;
    if (precio) {
      if (f.valor_arranque !== inicial.valor_arranque) c.valor_arranque = f.valor_arranque || null;
      if (f.valor_mensual !== inicial.valor_mensual) c.valor_mensual = f.valor_mensual || null;
      if (f.moneda !== inicial.moneda) c.moneda = f.moneda;
    }
    if (!Object.keys(c).length) return;
    await correr(() => llamar("PATCH", `/oportunidades/${id}`, c));
  }

  return (
    <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Título" className="sm:col-span-2"><input required maxLength={200} value={f.titulo} onChange={pon("titulo")} className="campo" /></Campo>
      <Campo etiqueta="Responsable">
        <select value={f.responsable_id} onChange={pon("responsable_id")} className="campo">
          <option value="">— Nadie —</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </Campo>
      {precio && (
        <>
          <Campo etiqueta="Moneda">
            <select value={f.moneda} onChange={pon("moneda")} className="campo"><option>COP</option><option>EUR</option><option>USD</option></select>
          </Campo>
          <Campo etiqueta="Arranque" ayuda="Sin puntos: 2500000"><input inputMode="numeric" value={f.valor_arranque} onChange={pon("valor_arranque")} className="campo" /></Campo>
          <Campo etiqueta="Mensualidad"><input inputMode="numeric" value={f.valor_mensual} onChange={pon("valor_mensual")} className="campo" /></Campo>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="boton-secundario">{enviando ? "Guardando…" : "Guardar cambios"}</button>
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>
    </form>
  );
}
