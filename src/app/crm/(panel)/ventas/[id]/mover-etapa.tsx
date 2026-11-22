"use client";

import { useState } from "react";
import { type Etapa, ETAPAS, ETAPAS_ABIERTAS, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { Campo } from "../../campo";

/**
 * Mover de etapa o, dejando la misma, cambiar el próximo paso. Las reglas son
 * las de la API (abierta = paso con fecha; perdida = motivo); aquí solo se
 * piden los campos que esa etapa necesita.
 */
export function MoverEtapa({ id, etapa, paso, fecha, puedeGanar }: { id: number; etapa: Etapa; paso: string | null; fecha: string; puedeGanar: boolean }) {
  const [a, setA] = useState<Etapa>(etapa);
  const [proximo, setProximo] = useState(paso ?? "");
  const [at, setAt] = useState(fecha);
  const [motivo, setMotivo] = useState("");
  const { enviando, error, correr } = useAccion();
  const abierta = ETAPAS_ABIERTAS.includes(a);
  const opciones = ETAPAS.filter((e) => e !== "ganado" || puedeGanar || etapa === "ganado");

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const cuerpo: Record<string, unknown> = { a };
    if (abierta) Object.assign(cuerpo, { proximo_paso: proximo, proximo_paso_at: at });
    if (a === "perdido") cuerpo.motivo_perdida = motivo;
    await correr(() => llamar("POST", `/oportunidades/${id}/etapa`, cuerpo));
  }

  return (
    <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Etapa" ayuda={puedeGanar ? undefined : "Marcarla ganada lo hace Victor o Karen."}>
        <select value={a} onChange={(e) => setA(e.target.value as Etapa)} className="campo">
          {opciones.map((e) => <option key={e} value={e}>{NOMBRE_ETAPA[e]}</option>)}
        </select>
      </Campo>
      {abierta && (
        <>
          <Campo etiqueta="Fecha del próximo paso"><input type="date" required value={at} onChange={(e) => setAt(e.target.value)} className="campo" /></Campo>
          <Campo etiqueta="Próximo paso" className="sm:col-span-2"><input required maxLength={300} value={proximo} onChange={(e) => setProximo(e.target.value)} className="campo" /></Campo>
        </>
      )}
      {a === "perdido" && (
        <Campo etiqueta="Motivo" className="sm:col-span-2" ayuda="Precio, tiempo, eligió otra cosa… Sirve para aprender, no para culpar.">
          <input required maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="campo" />
        </Campo>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="boton-principal">{enviando ? "Guardando…" : a === etapa ? "Guardar próximo paso" : `Mover a ${NOMBRE_ETAPA[a]}`}</button>
        {error && <p role="alert" className="text-[14px] text-[#B42318]">{error}</p>}
      </div>
    </form>
  );
}
