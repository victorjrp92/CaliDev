"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

/** Solo existe mientras nadie ha firmado. Pide confirmar con un segundo toque. */
export function BorrarContrato({ id, volver }: { id: number; volver: string }) {
  const router = useRouter();
  const [seguro, setSeguro] = useState(false);
  const { enviando, error, correr } = useAccion();

  async function borrar() {
    const r = await correr(() => llamar("DELETE", `/contratos/${id}`, undefined, { clave: crypto.randomUUID() }), { refrescar: false });
    if (r) router.replace(volver);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {seguro ? (
        <>
          <button type="button" disabled={enviando} onClick={borrar} className="boton-secundario !text-[var(--peligro)]">{enviando ? "Borrando…" : "Sí, borrar el contrato"}</button>
          <button type="button" onClick={() => setSeguro(false)} className="boton-chico">Cancelar</button>
        </>
      ) : (
        <button type="button" onClick={() => setSeguro(true)} className="boton-chico">Borrar contrato</button>
      )}
      {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
    </div>
  );
}
