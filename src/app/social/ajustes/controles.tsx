"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Interruptores globales del agente. Cambiar a modo real pide confirmación. */
export function Controles({ pausado, simulacion }: { pausado: boolean; simulacion: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function enviar(cuerpo: object, clave: string) {
    setOcupado(clave);
    const r = await fetch("/api/social/ajustes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo),
    });
    setOcupado(null);
    if (!r.ok) alert("No se pudo guardar el cambio.");
    router.refresh();
  }

  async function sincronizar() {
    setOcupado("sync");
    const r = await fetch("/api/social/publicaciones", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setOcupado(null);
    alert(r.ok ? `${d.publicaciones} publicaciones sincronizadas.` : "No se pudo sincronizar.");
    router.refresh();
  }

  const boton = "min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        disabled={!!ocupado}
        onClick={() => enviar({ pausado: !pausado }, "pausa")}
        className={`${boton} ${pausado ? "bg-[#B42318] text-white" : "bg-[var(--lima)] text-[var(--verde)]"}`}
      >
        {pausado ? "Pausado · reanudar" : "Activo · pausar"}
      </button>
      <button
        disabled={!!ocupado}
        onClick={() => {
          if (simulacion && !confirm("¿Pasar a modo real? El agente empezará a publicar en Instagram.")) return;
          enviar({ simulacion: !simulacion }, "sim");
        }}
        className={`${boton} ${simulacion ? "border border-[#D5DAD2] bg-white text-[var(--tinta)]" : "bg-[var(--verde)] text-white"}`}
      >
        {simulacion ? "Simulación · pasar a real" : "Respondiendo de verdad · simular"}
      </button>
      <button disabled={!!ocupado} onClick={sincronizar} className={`${boton} bg-[var(--azul)] text-white`}>
        {ocupado === "sync" ? "Sincronizando…" : "Traer publicaciones"}
      </button>
      <button
        disabled={!!ocupado}
        onClick={() => confirm("¿Volver a poner en cola los comentarios decididos en simulación?") && enviar({ reprocesarSimulados: true }, "rep")}
        className={`${boton} border border-[#D5DAD2] bg-white text-[var(--tinta)]`}
      >
        Reprocesar simulados
      </button>
    </div>
  );
}
