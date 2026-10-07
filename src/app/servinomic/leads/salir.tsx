"use client";

/**
 * Cerrar sesión del panel. Importa justamente porque la contraseña se comparte:
 * quien abre esto en un ordenador prestado tiene que poder dejarlo cerrado.
 */
export function Salir() {
  async function salir() {
    await fetch("/api/servinomic/panel", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={salir}
      className="mono cursor-pointer rounded-full border border-[#D8DCD4] px-4 py-2 text-[11px] text-[#46554D] transition-colors hover:border-[var(--verde)] hover:text-[var(--verde)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)]"
    >
      Cerrar sesión
    </button>
  );
}
