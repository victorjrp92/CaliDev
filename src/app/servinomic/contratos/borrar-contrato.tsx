"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Borra un contrato que nadie ha firmado (pruebas o errores). Pide confirmación. */
export function BorrarContrato({ id, titulo }: { id: number; titulo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function borrar() {
    if (!window.confirm(`¿Borrar «${titulo}»? Los enlaces de firma dejarán de funcionar.`)) return;
    const res = await fetch("/servinomic/leads/contratos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (res?.ok) router.refresh();
    else setError("No se pudo borrar.");
  }

  return (
    <span className="flex items-center gap-2">
      <button type="button" onClick={borrar} className="cursor-pointer text-[13px] text-[#8C948D] underline underline-offset-2 hover:text-[#B42318]">
        Borrar contrato
      </button>
      {error && <span className="text-[12.5px] text-[#B42318]">{error}</span>}
    </span>
  );
}
