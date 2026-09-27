"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Modo, Textos } from "@/lib/social/tipos";
import { Flujo } from "./flujo";
import { Simulador } from "./simulador";

export interface ConfigEditable {
  modo: Modo; sensible: boolean; landingUrl: string | null; palabrasClave: string[];
  detectarInteres: boolean; umbral: number; contexto: string | null; textos: Textos;
}

/** Editor de la automatización de una publicación. Todo lo que el agente hace sale de aquí. */
export function Editor({ mediaId, inicial, landings, otras }: {
  mediaId: string; inicial: ConfigEditable; landings: string[];
  otras: { mediaId: string; titulo: string; config: ConfigEditable }[];
}) {
  const router = useRouter();
  const [c, setC] = useState<ConfigEditable>(inicial);
  const [claves, setClaves] = useState(inicial.palabrasClave.join(", "));
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof ConfigEditable>(k: K, v: ConfigEditable[K]) => setC((x) => ({ ...x, [k]: v }));
  const config = { ...c, palabrasClave: claves.split(",").map((x) => x.trim()).filter(Boolean) };

  async function guardar() {
    if (c.modo === "automatico" && !confirm("Con el modo automático el agente responderá en Instagram los comentarios nuevos de esta publicación. ¿Guardar?")) return;
    setGuardando(true);
    const r = await fetch(`/api/social/automatizaciones/${mediaId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config),
    });
    const d = await r.json().catch(() => ({}));
    setGuardando(false);
    setEstado(r.ok ? { tipo: "ok", texto: "Guardado." } : { tipo: "error", texto: d.error ?? "No se pudo guardar" });
    if (r.ok) router.refresh();
  }

  const MODOS: { id: Modo; texto: string }[] = [
    { id: "automatico", texto: "Automático" }, { id: "borradores", texto: "Solo borradores" }, { id: "apagado", texto: "Apagado" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#E3E6E0] bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Modo del agente" className="flex overflow-hidden rounded-xl border border-[#D5DAD2]">
            {MODOS.map((m) => (
              <button key={m.id} role="radio" aria-checked={c.modo === m.id} onClick={() => set("modo", m.id)}
                className={`min-h-11 cursor-pointer px-4 text-sm ${c.modo === m.id ? "bg-[var(--verde)] font-semibold text-[var(--lima)]" : "bg-white"}`}>
                {m.texto}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.sensible} onChange={(e) => set("sensible", e.target.checked)} /> Tema sensible (todo pasa por mí)
          </label>
          {otras.length > 0 && (
            <select aria-label="Duplicar configuración" defaultValue="" onChange={(e) => {
              const o = otras.find((x) => x.mediaId === e.target.value);
              if (o) { setC({ ...o.config, modo: c.modo }); setClaves(o.config.palabrasClave.join(", ")); }
            }} className="ml-auto rounded-xl border border-[#D5DAD2] px-3 py-2 text-sm">
              <option value="">Duplicar de otra publicación…</option>
              {otras.map((o) => <option key={o.mediaId} value={o.mediaId}>{o.titulo}</option>)}
            </select>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Landing del botón «Sí»</span>
            <input list="landings" value={c.landingUrl ?? ""} onChange={(e) => set("landingUrl", e.target.value || null)} placeholder="https://calidev.dev/…"
              className="rounded-xl border border-[#D5DAD2] px-3 py-2.5" />
            <datalist id="landings">{landings.map((l) => <option key={l} value={l} />)}</datalist>
            <span className="text-xs text-[#55635C]">El enlace sale medido: UTM + código de la persona.</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Palabras clave (separadas por coma)</span>
            <input value={claves} onChange={(e) => setClaves(e.target.value)} className="rounded-xl border border-[#D5DAD2] px-3 py-2.5" />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={c.detectarInteres} onChange={(e) => set("detectarInteres", e.target.checked)} />
            <span><b>También si muestra interés sin la palabra clave</b><br /><span className="text-xs text-[#55635C]">Jev detecta «¿esto sirve para mi restaurante?» o «¿cuánto cuesta?».</span></span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Si Jev duda por debajo de {Math.round(c.umbral * 100)} % → te lo deja a ti</span>
            <input type="range" min={50} max={95} value={Math.round(c.umbral * 100)} onChange={(e) => set("umbral", Number(e.target.value) / 100)} />
          </label>
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            <span className="font-semibold">De qué trata el video (contexto para Jev y la IA)</span>
            <textarea value={c.contexto ?? ""} onChange={(e) => set("contexto", e.target.value || null)} rows={2} maxLength={600}
              placeholder="El video es de una clienta (dueña de LimpiaExpress) recomendando a Victor y a Calidev…" className="rounded-xl border border-[#D5DAD2] px-3 py-2.5" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Conversación por mensaje</h2>
        <Flujo t={c.textos} onCambio={(t) => set("textos", t)} />
      </section>

      <Simulador config={config} />

      <div className="sticky bottom-20 flex items-center gap-3 rounded-2xl border border-[#E3E6E0] bg-white/95 p-3 backdrop-blur md:bottom-4">
        {estado && <span role="status" className={`text-sm ${estado.tipo === "ok" ? "text-[var(--verde)]" : "text-[#B42318]"}`}>{estado.texto}</span>}
        <button onClick={guardar} disabled={guardando} className="ml-auto min-h-11 cursor-pointer rounded-xl bg-[var(--verde)] px-6 text-sm font-semibold text-white disabled:opacity-50">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
