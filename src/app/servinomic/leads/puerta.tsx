"use client";

import { useState } from "react";

/**
 * La puerta del panel. Un solo campo y nada más: no hay registro, no hay
 * recuperación y no hay usuario — quien tiene la contraseña entra.
 *
 * El campo lleva `autoComplete="current-password"` para que el gestor de
 * contraseñas la guarde y la ofrezca; sin eso, una contraseña compartida acaba
 * en una nota del teléfono.
 */
export function Puerta() {
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/servinomic/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: contrasena }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const datos = await res.json().catch(() => ({}));
      setError(datos.error ?? "No pudimos verificar la contraseña.");
    } catch {
      setError("No pudimos conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <p className="mono text-[var(--verde)]">Panel privado</p>
      <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight">
        Leads de la campaña
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#46554D]">
        Esta página no es pública. Escribe la contraseña para ver los contactos.
      </p>

      <form onSubmit={entrar} className="mt-7">
        <label htmlFor="panel-contrasena" className="mb-1.5 block text-[13.5px] font-semibold">
          Contraseña
        </label>
        <input
          id="panel-contrasena"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="h-14 w-full rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white px-4 text-[16px] outline-none transition-colors focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-[#B42318]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={contrasena.length < 1 || enviando}
          className="mt-5 h-14 w-full cursor-pointer rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
