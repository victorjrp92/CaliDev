"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";
import { MostrarUnaVez } from "./mostrar-una-vez";

/**
 * Clave cdv_… para la CLI o para un agente. Los alcances recortan lo que el rol
 * ya permite (vacío = todo lo del rol); nunca suman.
 */
export function NuevaClave({ yo, usuarios }: { yo: number; usuarios: { id: number; nombre: string }[] | null }) {
  const [f, setF] = useState({ nombre: "", usuario_id: String(yo), alcances: "", dias: "" });
  const [clave, setClave] = useState<string | null>(null);
  const { enviando, error, correr } = useAccion();

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    setClave(null);
    const alcances = f.alcances.split(/[\s,]+/).filter(Boolean);
    const cuerpo: Record<string, unknown> = { nombre: f.nombre, usuario_id: Number(f.usuario_id), alcances };
    if (f.dias) cuerpo.dias_vigencia = Number(f.dias);
    const r = await correr(() => llamar<{ clave: string }>("POST", "/claves", cuerpo, { clave: crypto.randomUUID() }));
    if (r) {
      setClave(r.clave);
      setF({ ...f, nombre: "", alcances: "", dias: "" });
    }
  }

  return (
    <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre" ayuda="Para reconocerla: «CLI portátil», «preparador de citas»."><input required maxLength={80} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="campo" /></Campo>
      {usuarios && (
        <Campo etiqueta="De quién">
          <select value={f.usuario_id} onChange={(e) => setF({ ...f, usuario_id: e.target.value })} className="campo">
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.id === yo ? " (yo)" : ""}</option>)}
          </select>
        </Campo>
      )}
      <Campo etiqueta="Alcances" ayuda="Vacío = todo lo de su rol. Ej.: ventas:leer contactos:*">
        <input value={f.alcances} onChange={(e) => setF({ ...f, alcances: e.target.value })} className="campo mono" />
      </Campo>
      <Campo etiqueta="Vence en (días)" ayuda="Vacío = no vence.">
        <input inputMode="numeric" pattern="[0-9]*" value={f.dias} onChange={(e) => setF({ ...f, dias: e.target.value })} className="campo" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear clave"}</button>
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>
      {clave && <div className="sm:col-span-2"><MostrarUnaVez titulo="Clave nueva" valor={clave} aviso="Guárdala ahora: no se vuelve a mostrar." /></div>}
    </form>
  );
}
