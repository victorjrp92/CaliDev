"use client";

import { useState } from "react";

/** Un enlace de invitación o una clave que solo se ve ahora: se muestra entero y se copia con un toque. */
export function MostrarUnaVez({ titulo, valor, aviso }: { titulo: string; valor: string; aviso: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border-[1.5px] border-[var(--verde)] bg-[var(--niebla)] px-4 py-3">
      <p className="text-[14px] font-semibold">{titulo}</p>
      <code className="mono block break-all text-[13px] !normal-case !tracking-normal">{valor}</code>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton-chico" data-tono="si"
          onClick={async () => { await navigator.clipboard.writeText(valor); setCopiado(true); }}>{copiado ? "Copiado" : "Copiar"}</button>
        <span className="text-[13px] text-[#46554D]">{aviso}</span>
      </div>
    </div>
  );
}
