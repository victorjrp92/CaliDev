"use client";

import { useState } from "react";
import { MONEDAS } from "@/lib/crm/dinero";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";
import { numeroDe } from "../finanzas/constantes";
import { CONCEPTOS_PRECIO, NOMBRE_PRECIO } from "./conceptos-precio";

const VACIO = { concepto: "mensualidad", valor: "", moneda: "COP", incluye: "" };

/** Publica un precio nuevo para un concepto del producto: cierra el vigente y deja el historial. */
export function FijarPrecio({ productoId }: { productoId: number }) {
  const [f, setF] = useState(VACIO);
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState(false);
  const { enviando, error, setError, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setHecho(false); setF({ ...f, [k]: e.target.value }); };

  async function fijar(ev: React.FormEvent) {
    ev.preventDefault();
    const valor = numeroDe(f.valor);
    if (!valor) return setError("El valor es un número mayor que cero, sin puntos de miles (250000).");
    const cuerpo: Record<string, unknown> = { concepto: f.concepto, valor, moneda: f.moneda };
    if (f.incluye.trim()) cuerpo.incluye = f.incluye.trim();
    const r = await correr(() => llamar("POST", `/productos/${productoId}/precios`, cuerpo, { clave }));
    if (r) {
      setHecho(true);
      setF(VACIO);
      setClave(crypto.randomUUID());
    }
  }

  return (
    <details className="border-t border-[var(--linea)] px-4 py-3">
      <summary className="cursor-pointer select-none text-[14px] font-semibold text-[var(--acento-texto)]">Fijar precio</summary>
      <form onSubmit={fijar} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Concepto">
          <select value={f.concepto} onChange={pon("concepto")} className="campo">{CONCEPTOS_PRECIO.map((c) => <option key={c} value={c}>{NOMBRE_PRECIO[c]}</option>)}</select>
        </Campo>
        <Campo etiqueta="Moneda">
          <select value={f.moneda} onChange={pon("moneda")} className="campo">{MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </Campo>
        <Campo etiqueta="Valor"><input required inputMode="decimal" value={f.valor} onChange={pon("valor")} className="campo num" /></Campo>
        <Campo etiqueta="Qué incluye (opcional)"><input maxLength={300} value={f.incluye} onChange={pon("incluye")} className="campo" /></Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-chico" data-tono="si">{enviando ? "Guardando…" : "Fijar precio"}</button>
          {error && <p role="alert" className="text-[13px] text-[var(--peligro)]">{error}</p>}
          {hecho && <p role="status" className="text-[13px] text-[var(--ok)]">Precio publicado.</p>}
        </div>
      </form>
    </details>
  );
}
