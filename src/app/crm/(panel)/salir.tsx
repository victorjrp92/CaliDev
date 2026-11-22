"use client";

import { llamar } from "@/lib/crm/llamar";

export function Salir() {
  async function salir() {
    await llamar("DELETE", "/sesion").catch(() => null);
    window.location.assign("/crm/entrar");
  }
  return (
    <button type="button" onClick={salir} className="boton boton-sec">
      Salir
    </button>
  );
}
