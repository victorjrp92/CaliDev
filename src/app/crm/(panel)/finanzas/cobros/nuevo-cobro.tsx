"use client";

import Link from "next/link";
import { useState } from "react";
import { MONEDAS } from "@/lib/crm/dinero";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";
import { CONCEPTOS, METODOS, NOMBRE_CONCEPTO, NOMBRE_METODO, numeroDe } from "../constantes";

const VACIO = { empresa: "", valor: "", moneda: "COP", vence: "", concepto: "cuota", metodo: "transferencia", descripcion: "" };

/** Cobro suelto a una empresa con suscripción. Por Stripe pide descripción; si lo pide un agente queda en Aprobaciones. */
export function NuevoCobro({ empresas, abierto = false }: { empresas: { id: number; nombre: string }[]; abierto?: boolean }) {
  const [f, setF] = useState(VACIO);
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState<"creado" | "pendiente" | null>(null);
  const { enviando, error, setError, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setHecho(null); setF({ ...f, [k]: e.target.value }); };
  const cambiarMoneda = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moneda = e.target.value;
    setHecho(null);
    setF({ ...f, moneda, metodo: moneda === "COP" ? "transferencia" : "stripe" });
  };
  const porStripe = f.metodo === "stripe";

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const valor = numeroDe(f.valor);
    if (!valor) return setError("El valor es un número mayor que cero, sin puntos de miles (1500000).");
    if (porStripe && !f.descripcion.trim()) return setError("Por Stripe la descripción es obligatoria: es lo que el cliente ve al pagar.");
    const cuerpo: Record<string, unknown> = { empresa_id: Number(f.empresa), valor, moneda: f.moneda, vence_at: f.vence, concepto: f.concepto, metodo: f.metodo };
    if (f.descripcion.trim()) cuerpo.descripcion = f.descripcion.trim();
    const r = await correr(() => llamar<{ estado: "creado" | "pendiente" }>("POST", "/cobros", cuerpo, { clave }));
    if (r) {
      setHecho(r.estado);
      setF(VACIO);
      setClave(crypto.randomUUID());
    }
  }

  return (
    <details open={abierto} className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Nuevo cobro</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Empresa" className="sm:col-span-2">
          <select required value={f.empresa} onChange={pon("empresa")} className="campo">
            <option value="">Elige la empresa</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Valor"><input required inputMode="decimal" value={f.valor} onChange={pon("valor")} className="campo num" placeholder="1500000" /></Campo>
        <Campo etiqueta="Moneda">
          <select value={f.moneda} onChange={cambiarMoneda} className="campo">{MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </Campo>
        <Campo etiqueta="Vence"><input required type="date" value={f.vence} onChange={pon("vence")} className="campo" /></Campo>
        <Campo etiqueta="Concepto">
          <select value={f.concepto} onChange={pon("concepto")} className="campo">{CONCEPTOS.map((c) => <option key={c} value={c}>{NOMBRE_CONCEPTO[c]}</option>)}</select>
        </Campo>
        <Campo etiqueta="Método" ayuda="Stripe cobra en euros o dólares; en pesos, transferencia o efectivo.">
          <select value={f.metodo} onChange={pon("metodo")} className="campo">
            {METODOS.map((m) => <option key={m} value={m} disabled={m === "stripe" && f.moneda === "COP"}>{NOMBRE_METODO[m]}</option>)}
          </select>
        </Campo>
        <Campo etiqueta={porStripe ? "Descripción (obligatoria por Stripe)" : "Descripción"} ayuda={porStripe ? "Es lo que el cliente ve al pagar." : undefined}>
          <input required={porStripe} maxLength={300} value={f.descripcion} onChange={pon("descripcion")} className="campo" />
        </Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear cobro"}</button>
          {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
          {hecho === "creado" && <p role="status" className="text-[14px] text-[var(--ok)]">Cobro creado.</p>}
          {hecho === "pendiente" && (
            <p role="status" className="text-[14px] text-[var(--aviso)]">
              No se creó todavía: quedó en <Link href="/crm/aprobaciones" className="font-semibold">Aprobaciones</Link> esperando que alguien lo apruebe.
            </p>
          )}
        </div>
      </form>
    </details>
  );
}
