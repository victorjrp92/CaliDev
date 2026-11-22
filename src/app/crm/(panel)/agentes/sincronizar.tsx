"use client";

import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

type Resumen = { personas: number; enlaces: number; oportunidades: number; avances: number; errores: string[] };

/** Trae ya lo nuevo de leads, citas, contactos e Instagram (pasa solo cada 5 min al abrir el CRM). */
export function Sincronizar() {
  const [r, setR] = useState<Resumen | null>(null);
  const { enviando, error, correr } = useAccion();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={enviando} className="boton-secundario"
          onClick={async () => { const x = await correr(() => llamar<{ resumen: Resumen | null }>("POST", "/sincronizar")); if (x) setR(x.resumen); }}>
          {enviando ? "Sincronizando…" : "Sincronizar ahora"}
        </button>
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>
      {r && (
        <p role="status" className="cifra text-[14px] text-[var(--texto-2)]">
          {r.personas} personas nuevas · {r.enlaces} enlaces · {r.oportunidades} oportunidades · {r.avances} avances de etapa
          {r.errores.length > 0 && <span className="block text-[var(--peligro)]">Con errores: {r.errores.join(" · ")}</span>}
        </p>
      )}
    </div>
  );
}
