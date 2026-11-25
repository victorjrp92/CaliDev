"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";
import { numeroDe } from "../finanzas/constantes";
import { CONCEPTOS_PRECIO, NOMBRE_PRECIO } from "./conceptos-precio";

const VACIO = { codigo: "", descripcion: "", concepto: "arranque", tipo: "porcentaje", cantidad: "", producto: "", hasta: "" };

/** Promoción con su código: un porcentaje o un valor fijo sobre un concepto, de un producto o de todos. */
export function NuevaPromo({ productos }: { productos: { id: number; nombre: string }[] }) {
  const [f, setF] = useState(VACIO);
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState(false);
  const { enviando, error, setError, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setHecho(false); setF({ ...f, [k]: e.target.value }); };

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const cantidad = numeroDe(f.cantidad);
    if (!cantidad) return setError(f.tipo === "porcentaje" ? "El porcentaje es un número entre 0 y 100." : "El valor es un número mayor que cero, sin puntos de miles.");
    const cuerpo: Record<string, unknown> = { codigo: f.codigo.trim(), descripcion: f.descripcion.trim(), concepto: f.concepto, [f.tipo === "porcentaje" ? "porcentaje" : "valor"]: cantidad };
    if (f.producto) cuerpo.producto_id = Number(f.producto);
    if (f.hasta) cuerpo.vigente_hasta = `${f.hasta}T23:59:59-05:00`;
    const r = await correr(() => llamar("POST", "/promos", cuerpo, { clave }));
    if (r) {
      setHecho(true);
      setF(VACIO);
      setClave(crypto.randomUUID());
    }
  }

  return (
    <details className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Nueva promo</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Código" ayuda="2 a 40 letras, números, - o _; el cliente lo escribe tal cual."><input required maxLength={40} value={f.codigo} onChange={pon("codigo")} className="campo" placeholder="captura" /></Campo>
        <Campo etiqueta="Descripción" ayuda="Qué descuento es, en una línea."><input required maxLength={300} value={f.descripcion} onChange={pon("descripcion")} className="campo" /></Campo>
        <Campo etiqueta="Se aplica a">
          <select value={f.concepto} onChange={pon("concepto")} className="campo">{CONCEPTOS_PRECIO.map((c) => <option key={c} value={c}>{NOMBRE_PRECIO[c]}</option>)}</select>
        </Campo>
        <Campo etiqueta="Producto">
          <select value={f.producto} onChange={pon("producto")} className="campo">
            <option value="">Todos los productos</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Tipo de descuento">
          <select value={f.tipo} onChange={pon("tipo")} className="campo">
            <option value="porcentaje">Porcentaje</option>
            <option value="valor">Valor fijo</option>
          </select>
        </Campo>
        <Campo etiqueta={f.tipo === "porcentaje" ? "Porcentaje (hasta 100)" : "Valor a descontar"}><input required inputMode="decimal" value={f.cantidad} onChange={pon("cantidad")} className="campo num" /></Campo>
        <Campo etiqueta="Vigente hasta (opcional)" ayuda="Vacío = sin vencimiento."><input type="date" value={f.hasta} onChange={pon("hasta")} className="campo" /></Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear promo"}</button>
          {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
          {hecho && <p role="status" className="text-[14px] text-[var(--ok)]">Promo creada.</p>}
        </div>
      </form>
    </details>
  );
}
