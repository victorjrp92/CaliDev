"use client";

import { useState } from "react";
import { llamar, mensajeDe } from "@/lib/crm/llamar";
import { Campo } from "../(panel)/campo";

export function FormularioEntrar() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await llamar("POST", "/sesion", { correo, contrasena });
      window.location.assign("/crm/hoy");
    } catch (e) {
      setError(mensajeDe(e));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mt-6 flex flex-col gap-4">
      <Campo etiqueta="Correo">
        <input type="email" required autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} className="campo" />
      </Campo>
      <Campo etiqueta="Contraseña">
        <input type="password" required autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="campo" />
      </Campo>
      {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      <button type="submit" disabled={enviando} className="boton-principal mt-2">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
