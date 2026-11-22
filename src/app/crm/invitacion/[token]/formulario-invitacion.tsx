"use client";

import { useState } from "react";
import { llamar, mensajeDe } from "@/lib/crm/llamar";
import { Campo } from "../../(panel)/campo";

export function FormularioInvitacion({ token, correo }: { token: string; correo: string }) {
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aceptar(ev: React.FormEvent) {
    ev.preventDefault();
    if (contrasena !== repetida) return setError("Las dos contraseñas no coinciden.");
    setEnviando(true);
    setError(null);
    try {
      await llamar("POST", "/invitacion", { token, contrasena });
      window.location.assign("/crm/hoy");
    } catch (e) {
      setError(mensajeDe(e));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aceptar} className="mt-6 flex flex-col gap-4">
      {/* Para que el gestor de contraseñas la guarde con el correo correcto. */}
      <input type="email" autoComplete="username" value={correo} readOnly hidden />
      <Campo etiqueta="Contraseña nueva">
        <input type="password" required minLength={10} autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="campo" />
      </Campo>
      <Campo etiqueta="Repítela">
        <input type="password" required minLength={10} autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)} className="campo" />
      </Campo>
      {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      <button type="submit" disabled={enviando} className="boton-principal mt-2">
        {enviando ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
