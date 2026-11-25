"use client";

import Link from "next/link";
import { useState } from "react";
import type { Producto, Promo } from "@/lib/crm/catalogo";
import { MONEDAS } from "@/lib/crm/dinero";
import { plata } from "@/lib/crm/formato";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";
import { numeroDe } from "../constantes";
import { type CobroEditable, EditorCobrosAlta } from "./editor-cobros-alta";

type Resultado = { persona: { id: number }; suscripcion: { id: number; valor_mensual: string; moneda: string }; cobros: { id: number }[]; promo: string | null };

const VACIO = { empresa: "", nit: "", nombre: "", correo: "", whatsapp: "", producto: "", arranque: "", mensual: "", promo: "", moneda: "COP", personas: "", permanencia: "", inicio: "" };

/**
 * Alta de cliente en un paso: empresa, contacto, suscripción con su precio y los
 * cobros acordados. Un valor vacío toma el precio publicado del producto.
 */
export function FormularioAlta({ productos, promos, productoInicial }: { productos: Producto[]; promos: Promo[]; productoInicial: number | null }) {
  const [f, setF] = useState({ ...VACIO, producto: productoInicial ? String(productoInicial) : "" });
  const [cobros, setCobros] = useState<CobroEditable[]>([]);
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState<Resultado | null>(null);
  const { enviando, error, setError, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const producto = productos.find((p) => String(p.id) === f.producto);
  const publicado = (c: "arranque" | "mensualidad") => {
    const p = producto?.precios.find((x) => x.concepto === c && x.vigente_hasta === null && x.moneda === f.moneda);
    return p ? `Publicado: ${plata(p.valor, p.moneda)}` : `Sin precio publicado en ${f.moneda}`;
  };
  const promosDelProducto = promos.filter((p) => p.concepto === "arranque" && (p.producto_id === null || String(p.producto_id) === f.producto));

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const num = (t: string, campo: string): number | null | undefined => {
      if (!t.trim()) return null;
      const n = numeroDe(t);
      if (n === null) setError(`${campo}: un número mayor que cero, sin puntos de miles.`);
      return n ?? undefined;
    };
    const arranque = num(f.arranque, "Valor de arranque");
    const mensual = num(f.mensual, "Valor mensual");
    if (arranque === undefined || mensual === undefined) return;
    const lista = [];
    for (const [i, c] of cobros.entries()) {
      const valor = numeroDe(c.valor);
      if (!valor || !c.vence) return setError(`Cobro ${i + 1}: falta el valor o la fecha.`);
      lista.push({ valor, vence: c.vence, concepto: c.concepto });
    }
    const contacto: Record<string, string> = { nombre: f.nombre.trim() };
    if (f.correo.trim()) contacto.correo = f.correo.trim();
    if (f.whatsapp.trim()) contacto.whatsapp = f.whatsapp.trim();
    const cuerpo: Record<string, unknown> = { empresa: f.empresa.trim(), contacto, moneda: f.moneda, cobros: lista };
    if (f.nit.trim()) cuerpo.nit = f.nit.trim();
    if (f.producto) cuerpo.producto_id = Number(f.producto);
    if (arranque !== null) cuerpo.valor_arranque = arranque;
    if (mensual !== null) cuerpo.valor_mensual = mensual;
    if (f.promo) cuerpo.promo = f.promo;
    if (f.personas.trim()) cuerpo.personas = Number(f.personas);
    if (f.permanencia) cuerpo.permanencia_hasta = f.permanencia;
    if (f.inicio) cuerpo.inicio = f.inicio;
    const r = await correr(() => llamar<Resultado>("POST", "/clientes", cuerpo, { clave }));
    if (r) setHecho(r);
  }

  function otro() {
    setF({ ...VACIO, producto: f.producto });
    setCobros([]);
    setClave(crypto.randomUUID());
    setHecho(null);
  }

  if (hecho) {
    return (
      <section role="status" className="panel flex flex-col gap-4 px-[18px] py-5">
        <div className="flex flex-col gap-1">
          <h2 className="titulo-2">Cliente dado de alta</h2>
          <p className="nota">
            Suscripción de {plata(hecho.suscripcion.valor_mensual, hecho.suscripcion.moneda)} al mes
            {hecho.promo ? ` con la promo «${hecho.promo}»` : ""} y {hecho.cobros.length} {hecho.cobros.length === 1 ? "cobro" : "cobros"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/crm/contactos/${hecho.persona.id}`} className="boton-principal">Abrir la ficha</Link>
          <Link href="/crm/finanzas/cobros" className="boton-secundario">Ver cobros</Link>
          <button type="button" onClick={otro} className="boton-secundario">Dar de alta otro</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={crear} className="flex flex-col gap-6">
      <fieldset className="bloque flex flex-col gap-4 px-[18px] py-4">
        <legend className="sr-only">Cliente</legend>
        <p aria-hidden className="titulo-3">Cliente</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Empresa"><input required maxLength={200} value={f.empresa} onChange={pon("empresa")} className="campo" /></Campo>
          <Campo etiqueta="NIT"><input maxLength={40} value={f.nit} onChange={pon("nit")} className="campo" /></Campo>
          <Campo etiqueta="Nombre del contacto" className="sm:col-span-2"><input required maxLength={160} value={f.nombre} onChange={pon("nombre")} className="campo" /></Campo>
          <Campo etiqueta="Correo"><input type="email" maxLength={200} value={f.correo} onChange={pon("correo")} className="campo" /></Campo>
          <Campo etiqueta="WhatsApp" ayuda="Con indicativo: 573001234567"><input type="tel" inputMode="tel" maxLength={200} value={f.whatsapp} onChange={pon("whatsapp")} className="campo" /></Campo>
        </div>
      </fieldset>

      <fieldset className="bloque flex flex-col gap-4 px-[18px] py-4">
        <legend className="sr-only">Suscripción</legend>
        <p aria-hidden className="titulo-3">Suscripción</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Producto">
            <select required value={f.producto} onChange={pon("producto")} className="campo">
              <option value="">Elige el producto</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Moneda">
            <select value={f.moneda} onChange={pon("moneda")} className="campo">{MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
          </Campo>
          <Campo etiqueta="Valor de arranque" ayuda={`Vacío = precio publicado. ${publicado("arranque")}`}><input inputMode="decimal" value={f.arranque} onChange={pon("arranque")} className="campo num" /></Campo>
          <Campo etiqueta="Valor mensual" ayuda={`Vacío = precio publicado. ${publicado("mensualidad")}`}><input inputMode="decimal" value={f.mensual} onChange={pon("mensual")} className="campo num" /></Campo>
          <Campo etiqueta="Promo" ayuda="Se aplica sobre el arranque.">
            <select value={f.promo} onChange={pon("promo")} className="campo">
              <option value="">Sin promo</option>
              {promosDelProducto.map((p) => <option key={p.id} value={p.codigo}>{p.codigo} · {p.descripcion}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Personas incluidas"><input inputMode="numeric" value={f.personas} onChange={(e) => setF({ ...f, personas: e.target.value.replace(/\D/g, "") })} className="campo num" /></Campo>
          <Campo etiqueta="Inicio"><input type="date" value={f.inicio} onChange={pon("inicio")} className="campo" /></Campo>
          <Campo etiqueta="Permanencia hasta"><input type="date" value={f.permanencia} onChange={pon("permanencia")} className="campo" /></Campo>
        </div>
      </fieldset>

      <fieldset className="bloque flex flex-col gap-4 px-[18px] py-4">
        <legend className="sr-only">Cobros</legend>
        <p aria-hidden className="titulo-3">Cobros</p>
        <div className="grid gap-4 sm:grid-cols-2"><EditorCobrosAlta cobros={cobros} moneda={f.moneda} cambiar={setCobros} /></div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Dando de alta…" : "Dar de alta"}</button>
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>
    </form>
  );
}
