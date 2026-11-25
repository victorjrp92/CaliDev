"use client";

import Link from "next/link";
import { useState } from "react";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";

type Respuesta = { aprobacion: { id: number } | null; problema: string | null };

/**
 * Pegar las notas crudas de la llamada: el agente de resumen deja la nota
 * `resumen_llamada` y propone etapa y próximo paso, que esperan en Aprobaciones.
 */
export function ResumirLlamada({ id }: { id: number }) {
  const [notas, setNotas] = useState("");
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const [hecho, setHecho] = useState<Respuesta | null>(null);
  const { enviando, error, correr } = useAccion();

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = await correr(() => llamar<Respuesta>("POST", "/agentes/resumen", { oportunidad_id: id, notas }, { clave }));
    if (r) {
      setHecho(r);
      setNotas("");
      setClave(crypto.randomUUID());
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2">
      <textarea aria-label="Notas de la llamada" required minLength={20} maxLength={12000} rows={5} value={notas} onChange={(e) => setNotas(e.target.value)}
        placeholder="Pega o dicta lo que se habló: qué tienen hoy, qué duele, qué acordaron…" className="campo" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enviando || notas.trim().length < 20} className="boton-chico" data-tono="si">{enviando ? "Resumiendo…" : "Resumir llamada"}</button>
        {error && <p role="alert" className="text-[13px] text-[var(--peligro)]">{error}</p>}
        {hecho && !error && (
          <p role="status" className="nota">
            {hecho.aprobacion
              ? <>Resumen guardado en Notas. La etapa propuesta espera en <Link href="/crm/aprobaciones" className="font-medium text-[var(--acento-texto)] underline-offset-4 hover:underline">Aprobaciones</Link>.</>
              : hecho.problema ? `Resumen guardado en Notas. No se propuso etapa: ${hecho.problema}` : "Resumen guardado en Notas."}
          </p>
        )}
      </div>
    </form>
  );
}
