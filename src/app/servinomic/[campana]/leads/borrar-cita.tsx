"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botón de borrar una cita del panel, en dos toques: el primero pide
 * confirmación en el propio botón (el visor no muestra `confirm()` en todas
 * partes y un borrado no se deshace).
 */
export function BorrarCita({ campana, id, nombre }: { campana: string; id: number; nombre: string }) {
  const router = useRouter();
  const [seguro, setSeguro] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    if (!seguro) return setSeguro(true);
    setBorrando(true);
    const res = await fetch(`/servinomic/${campana}/leads/borrar-cita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setBorrando(false);
    setSeguro(false);
    if (res?.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={borrar}
      onBlur={() => setSeguro(false)}
      disabled={borrando}
      aria-label={`Borrar la cita de ${nombre}`}
      className={`h-8 cursor-pointer rounded-lg px-2.5 text-[12.5px] font-semibold ${
        seguro ? "bg-[#B42318] text-white" : "text-[#B42318] hover:bg-[#FDF0EE]"
      }`}
    >
      {borrando ? "Borrando…" : seguro ? "¿Borrar? Toca otra vez" : "Borrar"}
    </button>
  );
}
