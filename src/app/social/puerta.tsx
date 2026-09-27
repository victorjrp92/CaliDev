"use client";

import { useState } from "react";

/**
 * La puerta del panel social. Un solo campo: quien tiene la contraseña entra.
 * `autoComplete="current-password"` para que el gestor de contraseñas la
 * guarde (misma razón que en el panel de leads).
 */
export function Puerta({ configurado }: { configurado: boolean }) {
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/social/sesion", {
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <p className="mono text-[var(--verde)]">calidev.dev/social</p>
      <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight">Centro de operaciones de Instagram</h1>
      {!configurado ? (
        <p role="alert" className="mt-4 text-[15px] text-[#B42318]">
          El panel no está configurado: falta PANEL_SOCIAL_PASSWORD en Vercel.
        </p>
      ) : (
        <form onSubmit={entrar} className="mt-7">
          <label htmlFor="social-contrasena" className="mb-1.5 block text-[13.5px] font-semibold">
            Contraseña
          </label>
          <input
            id="social-contrasena"
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
      )}
    </main>
  );
}
