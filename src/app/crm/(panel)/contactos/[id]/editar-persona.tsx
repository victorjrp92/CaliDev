"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";

type Valores = { nombre: string; empresa: string; correo: string; whatsapp: string; usuario_ig: string; origen: string; notas: string };

/** Datos de la persona. Solo se manda lo que cambió; un campo vaciado se borra. */
export function EditarPersona({ id, inicial }: { id: number; inicial: Valores }) {
  const [f, setF] = useState(inicial);
  const { enviando, error, correr } = useAccion();
  const pon = (k: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const c: Record<string, string> = {};
    for (const k of Object.keys(inicial) as (keyof Valores)[]) if (f[k] !== inicial[k]) c[k] = f[k];
    if (!Object.keys(c).length) return;
    await correr(() => llamar("PATCH", `/personas/${id}`, c));
  }

  return (
    <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre" className="sm:col-span-2"><input required maxLength={160} value={f.nombre} onChange={pon("nombre")} className="campo" /></Campo>
      <Campo etiqueta="Empresa"><input maxLength={200} value={f.empresa} onChange={pon("empresa")} className="campo" /></Campo>
      <Campo etiqueta="Origen"><input maxLength={200} value={f.origen} onChange={pon("origen")} className="campo" /></Campo>
      <Campo etiqueta="Correo"><input type="email" maxLength={200} value={f.correo} onChange={pon("correo")} className="campo" /></Campo>
      <Campo etiqueta="WhatsApp" ayuda="Con indicativo: 573001234567"><input type="tel" inputMode="tel" maxLength={200} value={f.whatsapp} onChange={pon("whatsapp")} className="campo" /></Campo>
      <Campo etiqueta="Usuario de Instagram"><input maxLength={200} value={f.usuario_ig} onChange={pon("usuario_ig")} placeholder="sin @" className="campo" /></Campo>
      <Campo etiqueta="Notas" className="sm:col-span-2"><textarea rows={3} maxLength={5000} value={f.notas} onChange={pon("notas")} className="campo" /></Campo>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="boton-secundario">{enviando ? "Guardando…" : "Guardar cambios"}</button>
        {error && <p role="alert" className="text-[14px] text-[#B42318]">{error}</p>}
      </div>
    </form>
  );
}
