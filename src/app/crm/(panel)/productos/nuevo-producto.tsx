"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";

/** Producto nuevo del catálogo; sus precios se fijan después, uno por concepto. */
export function NuevoProducto() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState(false);
  const { enviando, error, correr } = useAccion();

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const r = await correr(() => llamar("POST", "/productos", { nombre: nombre.trim(), ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}) }, { clave }));
    if (r) {
      setHecho(true);
      setNombre("");
      setDescripcion("");
      setClave(crypto.randomUUID());
    }
  }

  return (
    <details className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Nuevo producto</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre"><input required maxLength={120} value={nombre} onChange={(e) => { setHecho(false); setNombre(e.target.value); }} className="campo" /></Campo>
        <Campo etiqueta="Descripción"><input maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="campo" /></Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear producto"}</button>
          {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
          {hecho && <p role="status" className="text-[14px] text-[var(--ok)]">Producto creado. Fíjale sus precios.</p>}
        </div>
      </form>
    </details>
  );
}
