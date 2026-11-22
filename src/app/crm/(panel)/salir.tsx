"use client";

import { llamar } from "@/lib/crm/llamar";

export function Salir() {
  async function salir() {
    await llamar("DELETE", "/sesion").catch(() => null);
    window.location.assign("/crm/entrar");
  }
  return (
    <button type="button" onClick={salir} className="rounded px-1 text-[var(--hueso)]/80 underline-offset-4 hover:text-[var(--hueso)] hover:underline">
      Salir
    </button>
  );
}
