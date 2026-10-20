"use client";

import { useState } from "react";

/** Copia el enlace de firma de una persona para pegarlo en WhatsApp o el correo. */
export function CopiarEnlace({ enlace }: { enlace: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copia el enlace:", enlace);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="h-8 cursor-pointer rounded-lg border border-[#D8DCD4] bg-white px-3 text-[12.5px] font-semibold text-[var(--verde)] hover:border-[var(--verde)]"
    >
      {copiado ? "Copiado" : "Copiar enlace"}
    </button>
  );
}
