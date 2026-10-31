"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopiarEnlace } from "../contratos/copiar-enlace";
import { PLANTILLAS } from "@/lib/arranque/plantillas";

/** Crea el formulario de arranque de un cliente y devuelve su enlace para copiar. */
export function NuevoArranque() {
  const router = useRouter();
  const [cliente, setCliente] = useState("");
  const [negocio, setNegocio] = useState("");
  const [plantilla, setPlantilla] = useState("servinomic");
  const [enlace, setEnlace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    setEnviando(true);
    setError(null);
    const res = await fetch("/servinomic/arranques/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, negocio, plantilla }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) {
      setEnlace(json.enlace);
      setCliente("");
      setNegocio("");
      router.refresh();
    } else setError(json.error ?? "Sin conexión.");
  }

  const campo = "mt-1 block h-11 w-full rounded-lg border-[1.5px] border-[#D8DCD4] bg-white px-3 text-[15px] outline-none focus:border-[var(--verde)]";
  return (
    <div className="rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:p-5">
      <p className="text-[16px] font-bold">Nuevo formulario de arranque</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
        <label className="text-[13px] font-semibold">
          Producto
          <select className={campo} value={plantilla} onChange={(e) => setPlantilla(e.target.value)}>
            {Object.values(PLANTILLAS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.producto}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] font-semibold">
          Nombre del cliente
          <input className={campo} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="María José" />
        </label>
        <label className="text-[13px] font-semibold">
          Negocio
          <input className={campo} value={negocio} onChange={(e) => setNegocio(e.target.value)} placeholder="Maison pure" />
        </label>
        <button type="button" onClick={crear} disabled={enviando} className="h-11 cursor-pointer rounded-lg bg-[var(--verde)] px-5 text-[14px] font-bold text-white disabled:opacity-60">
          {enviando ? "Creando…" : "Crear enlace"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-[13.5px] font-semibold text-[#B42318]">{error}</p>}
      {enlace && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
          Listo. Envíale este enlace: <CopiarEnlace enlace={enlace} />
        </p>
      )}
    </div>
  );
}
