"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../campo";
import { MostrarUnaVez } from "./mostrar-una-vez";

const ROLES = { humano: [["socia", "Socia (todo menos usuarios y claves ajenas)"], ["dueno", "Dueño (todo)"]], agente: [["agente", "Agente (prepara, no cierra)"], ["sistema", "Sistema (crons)"]] } as const;

/** Una persona recibe un enlace de invitación de un solo uso; un agente no entra con contraseña, se le crea una clave después. */
export function NuevoUsuario() {
  const [tipo, setTipo] = useState<"humano" | "agente">("humano");
  const [f, setF] = useState({ nombre: "", correo: "", rol: "socia" });
  const [enlace, setEnlace] = useState<string | null>(null);
  const { enviando, error, correr } = useAccion();

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    setEnlace(null);
    const r = await correr(() => llamar<{ invitacion: string | null }>("POST", "/usuarios", { ...f, tipo }, { clave: crypto.randomUUID() }));
    if (r) {
      setEnlace(r.invitacion);
      setF({ nombre: "", correo: "", rol: tipo === "humano" ? "socia" : "agente" });
    }
  }

  return (
    <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Tipo">
        <select value={tipo} onChange={(e) => { const t = e.target.value as "humano" | "agente"; setTipo(t); setF({ ...f, rol: ROLES[t][0][0] }); }} className="campo">
          <option value="humano">Persona</option><option value="agente">Agente</option>
        </select>
      </Campo>
      <Campo etiqueta="Rol">
        <select value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value })} className="campo">
          {ROLES[tipo].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Nombre"><input required maxLength={120} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className="campo" /></Campo>
      <Campo etiqueta="Correo" ayuda={tipo === "agente" ? "Un correo que identifique al agente, p. ej. preparador@calidev.dev" : undefined}>
        <input required type="email" maxLength={160} value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} className="campo" />
      </Campo>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Creando…" : tipo === "humano" ? "Crear e invitar" : "Crear agente"}</button>
        {error && <p role="alert" className="text-[14px] text-[#B42318]">{error}</p>}
      </div>
      {enlace && <div className="sm:col-span-2"><MostrarUnaVez titulo="Enlace de invitación" valor={enlace} aviso="Mándaselo tú por WhatsApp; sirve una sola vez." /></div>}
    </form>
  );
}
