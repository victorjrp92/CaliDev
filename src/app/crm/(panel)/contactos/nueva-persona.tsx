"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";

const VACIA = { nombre: "", empresa: "", correo: "", whatsapp: "", usuario_ig: "", origen: "", notas: "" };

/** Persona nueva. Solo el nombre es obligatorio; al crearla se abre su ficha. */
export function NuevaPersona() {
  const router = useRouter();
  const [f, setF] = useState(VACIA);
  const [clave] = useState(() => crypto.randomUUID());
  const { enviando, error, correr } = useAccion();
  const pon = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const cuerpo: Record<string, string> = { nombre: f.nombre };
    for (const k of ["empresa", "correo", "whatsapp", "usuario_ig", "origen", "notas"] as const) if (f[k].trim()) cuerpo[k] = f[k];
    const r = await correr(() => llamar<{ persona: { id: number } }>("POST", "/personas", cuerpo, { clave }), { refrescar: false });
    if (r) router.push(`/crm/contactos/${r.persona.id}`);
  }

  return (
    <details className="bloque group px-4 py-3">
      <summary className="cursor-pointer select-none font-semibold text-[var(--verde)]">Nueva persona</summary>
      <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" className="sm:col-span-2"><input required maxLength={160} value={f.nombre} onChange={pon("nombre")} className="campo" /></Campo>
        <Campo etiqueta="Empresa"><input maxLength={200} value={f.empresa} onChange={pon("empresa")} className="campo" /></Campo>
        <Campo etiqueta="Origen" ayuda="Cómo llegó: Instagram, referido, landing…"><input maxLength={200} value={f.origen} onChange={pon("origen")} className="campo" /></Campo>
        <Campo etiqueta="Correo"><input type="email" maxLength={200} value={f.correo} onChange={pon("correo")} className="campo" /></Campo>
        <Campo etiqueta="WhatsApp" ayuda="Con indicativo: 573001234567"><input type="tel" inputMode="tel" maxLength={200} value={f.whatsapp} onChange={pon("whatsapp")} className="campo" /></Campo>
        <Campo etiqueta="Usuario de Instagram"><input maxLength={200} value={f.usuario_ig} onChange={pon("usuario_ig")} placeholder="sin @" className="campo" /></Campo>
        <Campo etiqueta="Notas" className="sm:col-span-2"><textarea rows={3} maxLength={5000} value={f.notas} onChange={pon("notas")} className="campo" /></Campo>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear persona"}</button>
          {error && <p role="alert" className="text-[14px] text-[#B42318]">{error}</p>}
        </div>
      </form>
    </details>
  );
}
