"use client";

import { useState } from "react";
import { MONEDAS } from "@/lib/crm/dinero";
import { paraInputFecha } from "@/lib/crm/formato";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";
import { numeroDe } from "../constantes";

const VACIO = { proveedor: "", concepto: "", valor: "", moneda: "COP", empresa: "", fecha: "" };

/** Gasto con la tasa de su día. La empresa es opcional: si se pone, el gasto cuenta en el margen de ese cliente. */
export function NuevoGasto({ empresas }: { empresas: { id: number; nombre: string }[] }) {
  const [f, setF] = useState(VACIO);
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState(false);
  const { enviando, error, setError, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setHecho(false); setF({ ...f, [k]: e.target.value }); };

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const valor = numeroDe(f.valor);
    if (!valor) return setError("El valor es un número mayor que cero, sin puntos de miles (250000).");
    const cuerpo: Record<string, unknown> = { proveedor: f.proveedor.trim(), concepto: f.concepto.trim(), valor, moneda: f.moneda };
    if (f.empresa) cuerpo.empresa_id = Number(f.empresa);
    if (f.fecha) cuerpo.fecha = f.fecha;
    const r = await correr(() => llamar("POST", "/gastos", cuerpo, { clave }));
    if (r) {
      setHecho(true);
      setF(VACIO);
      setClave(crypto.randomUUID());
    }
  }

  return (
    <details className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Registrar gasto</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Proveedor"><input required maxLength={200} value={f.proveedor} onChange={pon("proveedor")} className="campo" placeholder="Vercel" /></Campo>
        <Campo etiqueta="Concepto"><input required maxLength={300} value={f.concepto} onChange={pon("concepto")} className="campo" placeholder="Hosting de noviembre" /></Campo>
        <Campo etiqueta="Valor"><input required inputMode="decimal" value={f.valor} onChange={pon("valor")} className="campo num" /></Campo>
        <Campo etiqueta="Moneda">
          <select value={f.moneda} onChange={pon("moneda")} className="campo">{MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </Campo>
        <Campo etiqueta="Cliente (opcional)" ayuda="Imputa el gasto a un cliente para su margen.">
          <select value={f.empresa} onChange={pon("empresa")} className="campo">
            <option value="">Ninguno: gasto general</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Fecha" ayuda="Vacía = hoy. Un gasto no puede ser futuro."><input type="date" max={paraInputFecha(new Date())} value={f.fecha} onChange={pon("fecha")} className="campo" /></Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Guardando…" : "Registrar gasto"}</button>
          {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
          {hecho && <p role="status" className="text-[14px] text-[var(--ok)]">Gasto registrado.</p>}
        </div>
      </form>
    </details>
  );
}
